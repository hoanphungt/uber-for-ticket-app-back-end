import { Controller, Get, Body, Param, Post, HttpCode, Put, NotFoundError, Authorized, Delete, CurrentUser } from 'routing-controllers'
import Ticket from './entity';
import User from '../users/entity';
import Event from '../events/entity';
import Comment from '../comments/entity';

@Controller()
export default class TicketsController {
    //get all tickets of all events
    @Get('/tickets')
    async allTickets() {
        const tickets = await Ticket.find()

        return { tickets }
    }
    //get all tickets of an event
    @Get('/events/:event_id/tickets')
    async getTickets(
        @Param('event_id') event_id: number
    ) {
        const event = await Event.findOne(event_id)
        if (!event) throw new NotFoundError('This event does not exist')

        const tickets = await Ticket.find({ where: { event: event } })

        return { tickets }
    }
    //get a ticket
    @Get('/tickets/:id')
    async getTicket(
        @Param('id') id: number
    ) {
        return await Ticket.findOne(id)
    }
    //create a ticket
    @Authorized()
    @Post('/events/:event_id/tickets')
    @HttpCode(201)
    async createTicket(
        @Body() ticket: Ticket,
        @CurrentUser() user: User,
        @Param('event_id') event_id: number

    ) {
        const event = await Event.findOne(event_id)
        if (!event) throw new NotFoundError('This event does not exist')

        ticket.user = user
        ticket.event = event
        ticket.risk = 0


        // *** FRAUD RISK ALGORITHM ***
        //if the ticket is the only ticket of the author, add 10% to the risk
        const tickets = await Ticket.find()
        const numberOfTicketOfAuthor = tickets.filter(ticket => ticket.user.id === user.id).length
        if (numberOfTicketOfAuthor === 0) ticket.risk += 10

        //risk assessment based on the price of the ticket
        //map through all the tickets to find tickets available for this event
        const ticketsForThisEvent = tickets.filter(ticket => ticket.event.id === event.id)
        const ticketPriceArray = ticketsForThisEvent.map(ticket => ticket.price)
        //calculate the total & average price of all tickets
        const totalPrice = ticketPriceArray.reduce((a, b) => a + b, 0)
        const averagePrice = totalPrice / ticketPriceArray.length
        //if ticket price is cheaper than the average price then add x% to the risk
        if (ticketsForThisEvent.length === 0) {
            return
        } else {
            if ((ticket.price - averagePrice) <= 0) {
                const x = (averagePrice - ticket.price) / averagePrice * 100
                ticket.risk += x
            } else {
                const x = (ticket.price - averagePrice) / averagePrice * 100
                if (x <= 10) {
                    ticket.risk -= x
                } else {
                    ticket.risk -= 10
                }
            }
        }
        //risk deducted 10% if ticket added during business hours (9-17)
        //otherwise, add 10% to the risk
        const hour = ticket.createdDate.getHours()
        if (hour >= 9 && hour <= 17) {
            ticket.risk -= 10
        } else {
            ticket.risk += 10
        }

        //add 5% risk if there are more than 3 comments on the ticket
        const comments = await Comment.find()
        const numberOfCommentOnTheTicket = comments.filter(comment => comment.ticket.id === ticket.id).length
        if (numberOfCommentOnTheTicket > 3) ticket.risk += 5
        //also check fraud risk during creation of comments (in comment controler)

        //minimal risk is 5% and maximum risk is 95%
        if (ticket.risk < 5) ticket.risk = 5
        if (ticket.risk > 95) ticket.risk = 95
        // *** END OF THE FRAUD RISK ALGORITHM ***

        return ticket.save()
    }
    //update a ticket
    @Authorized()
    @Put('/tickets/:id')
    async updateTicket(
        @Param('id') id: number,
        @Body() update: Partial<Ticket>
    ) {
        const ticket = await Ticket.findOne(id)

        if (!ticket) throw new NotFoundError('Cannot find the ticket')

        return Ticket.merge(ticket, update).save()
    }
    //delete a ticket
    @Authorized()
    @Delete('/tickets/:id')
    async deleteTicket(
        @Param('id') id: number
    ) {
        return Ticket.delete(id)
    }
}