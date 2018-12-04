import {Controller, Get, Body, Param, Post, HttpCode} from 'routing-controllers'
import Event from './entity';

@Controller()
export default class EventsController {

    @Get('/events')
    async allEvents() {
       const events = await Event.find()

       return { events }
    }

    @Get('/events/:id')
    async getEvent(
        @Param('id') id: number
    ) {
        return await Event.findOne(id)
    }

    @Post('/events')
    @HttpCode(201)
    createEvent(
        @Body() event: Event
    ) {
        return event.save()
    }

}