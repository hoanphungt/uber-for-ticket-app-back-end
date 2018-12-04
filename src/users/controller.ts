import { JsonController, Get, Param, Put, Body, NotFoundError, HttpCode, Post, Delete } from "routing-controllers";
import User from './entity';

@JsonController()
export default class UsersController {
    //create an user
    @Post('/users')
    @HttpCode(201)
    async createUser(
        @Body() user: User
    ) {
        const {password, ...rest} = user
        const entity = User.create(rest)
        await entity.setPassword(password)
        
        return entity.save()
    }
    //get an user
    @Get('/users/:id')
    getUser(
        @Param('id') id: number
    ) {
        return User.findOne(id)
    }
    //get all users
    @Get('/users')
    async allUsers() {
        const users = await User.find()
        return { users }
    }
    //update an user
    @Put('/users/:id')
    async updateUser(
        @Param('id') id: number,
        @Body() update: Partial<User>
    ) {
        const user = await User.findOne(id)
        if (!user) throw new NotFoundError('Cannot find the user')

        return User.merge(user, update).save()
    }    
    //delete an user
    @Delete('/users/:id')
    async deleteUser(
        @Param('id') id: number
    ) {
        return User.delete(id)
    }
}

