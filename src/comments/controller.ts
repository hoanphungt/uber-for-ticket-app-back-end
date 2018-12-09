import {Controller, Get, Body, Param, Post, HttpCode, Put, NotFoundError, Authorized, Delete, CurrentUser} from 'routing-controllers'
import Comment from './entity';
import Ticket from '../tickets/entity';
import User from '../users/entity';

@Controller()
export default class CommentsController {
    //get all comments of all tickets
    @Get('/comments')
    async allComments() {
       const comments = await Comment.find()

       return { comments }
    }
    //get all comments of a ticket
    @Get('/tickets/:ticket_id/comments')
    async getComments(
        @Param('ticket_id') ticket_id: number
    ) {
       const ticket = await Ticket.findOne(ticket_id)
       if (!ticket) throw new NotFoundError('This ticket does not exist')

       const comments = await Comment.find({where: {ticket: ticket}})

       return { comments }
    }
    //get a comment
    @Get('/comments/:id')
    async getComment(
        @Param('id') id: number
    ) {
        return await Comment.findOne(id)
    }
    //create a comment
    @Authorized()
    @Post('/tickets/:ticket_id/comments')
    @HttpCode(201)
    async createComment(
        @Body() comment: Comment,
        @CurrentUser() user: User,
        @Param('ticket_id') ticket_id: number
    ) {
        const ticket = await Ticket.findOne(ticket_id)
        if (!ticket) throw new NotFoundError('This ticket does not exist')
        
        comment.user = user
        comment.ticket = ticket

        // *** FRAUD RISK ALGORITHM ***
        //check if more than 3 comments are created for this ticket then add 5% risk
        const comments = await Comment.find()
        const numberOfCommentOfTheTicket = comments.filter(comment => comment.ticket.id === ticket.id).length
        if (numberOfCommentOfTheTicket >= 3) ticket.risk = ticket.risk + 5

        //minimal risk is 5% and maximum risk is 95%
        if (ticket.risk < 5) ticket.risk = 5
        if (ticket.risk > 95) ticket.risk = 95

        // *** END OF FRAUD RISK ALGORITHM ***
        
        return ticket.save() && comment.save()
    }
    //update a comment
    @Authorized()
    @Put('/comments/:id')
    async updateComment(
        @Param('id') id: number,
        @Body() update: Partial<Comment>
    ) {
        const comment = await Comment.findOne(id)

        if (!comment) throw new NotFoundError('This comment does not exist')

        return Comment.merge(comment, update).save()
    }
    //delete a comment
    @Authorized()
    @Delete('/comments/:id')
    async deleteComment(
        @Param('id') id: number
    ) {
        return Comment.delete(id)
    }
}