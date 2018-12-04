import {Controller, Get, Body, Param, Post, HttpCode, Put, NotFoundError, Authorized, Delete, CurrentUser} from 'routing-controllers'
import Ticket from './entity';
import User from '../users/entity';
import Event from '../events/entity';

@Controller()
export default class TicketsController {
    //get all tickets
    @Get('/tickets')
    async allTickets() {
       const tickets = await Ticket.find()

       return { tickets }
    }
    //get a tickets
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