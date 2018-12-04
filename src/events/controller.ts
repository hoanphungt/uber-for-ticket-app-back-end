import {Controller, Get, Body, Param, Post, HttpCode, Put, NotFoundError, Authorized, Delete, CurrentUser} from 'routing-controllers'
import Event from './entity';
import User from '../users/entity';

@Controller()
export default class EventsController {
    //create an event
    @Authorized()
    @Post('/events')
    @HttpCode(201)
    createEvent(
        @Body() event: Event,
        @CurrentUser() user: User
    ) {
        event.user = user

        return event.save()
    }
    //get all events
    @Get('/events')
    async allEvents() {
       const events = await Event.find()

       return { events }
    }
    //get an event
    @Get('/events/:id')
    async getEvent(
        @Param('id') id: number
    ) {
        return await Event.findOne(id)
    }    
    //update an event
    @Authorized()
    @Put('/events/:id')
    async updateEvent(
        @Param('id') id: number,
        @Body() update: Partial<Event>
    ) {
        const event = await Event.findOne(id)

        if (!event) throw new NotFoundError('Cannot find the event')

        return Event.merge(event, update).save()
    }
    //delete an event
    @Authorized()
    @Delete('/events/:id')
    async deleteEvent(
        @Param('id') id: number
    ) {
        return Event.delete(id)
    }
}