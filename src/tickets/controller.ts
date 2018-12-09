import { Controller, Get, Body, Param, Post, HttpCode, Put, NotFoundError, Authorized, Delete, CurrentUser, BadRequestError } from 'routing-controllers'
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
        ticket.risk = 5

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

        if (ticketsForThisEvent.length === 0) {
            ticket.risk = ticket.risk
        } else {
            //if ticket price is cheaper than the average price then add x% to the risk
            if ((ticket.price - averagePrice) <= 0) {
                const x = (averagePrice - ticket.price) / averagePrice * 100
                ticket.risk += x
            } else {
                //if ticket price is higher than the average price then reduce risk up to 10%
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
        @CurrentUser() currentUser: User,
        @Body() updatedTicket: Partial<Ticket>
    ) {
        const ticket = await Ticket.findOne(id)
        const tickets = await Ticket.find()

        if (!ticket) throw new NotFoundError('Cannot find the ticket')
        if (ticket.user.id !== currentUser.id) throw new BadRequestError('You are not the author of this ticket')

        // *** FRAUD RISK ALGORITHM ***
        //when update the price of the ticket, calculate the fraud risk again based on the new price!!!
        //if the ticket price is not changed then keep the risk as the same
        if (updatedTicket.price === ticket.price) {
            updatedTicket.risk = ticket.risk
        } else {
            //if the ticket price is changed then calculate the risk again:
            if (updatedTicket.price) {
                updatedTicket.risk = ticket.risk
                //risk assessment based on the price of the ticket
                //map through all the tickets to find tickets available for this event
                const ticketsForThisEvent = tickets.filter(a => a.event.id === ticket.event.id)
                const ticketPriceArray = ticketsForThisEvent.map(ticket => ticket.price)
                //calculate the total & average price of all tickets
                const totalPrice = ticketPriceArray.reduce((a, b) => a + b, 0)
                const averagePrice = totalPrice / ticketPriceArray.length
                //if updated ticket price is cheaper than the average price then add x% to the risk
                if ((updatedTicket.price - averagePrice) <= 0) {
                    const x = (averagePrice - updatedTicket.price) / averagePrice * 100
                    updatedTicket.risk += x
                } else {
                    //if updated ticket price is higher than the average price then reduce risk up to 10%
                    const x = (updatedTicket.price - averagePrice) / averagePrice * 100
                    if (x <= 10) {
                        updatedTicket.risk -= x
                    } else {
                        updatedTicket.risk -= 10
                    }
                }
                //minimal risk is 5% and maximum risk is 95%
                if (updatedTicket.risk < 5) updatedTicket.risk = 5
                if (updatedTicket.risk > 95) updatedTicket.risk = 95
            }
        }
        // *** END OF THE FRAUD RISK ALGORITHM ***

        return Ticket.merge(ticket, updatedTicket).save()
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