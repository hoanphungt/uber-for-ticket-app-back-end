import { JsonController, Body, Post, BadRequestError } from "routing-controllers";
import { IsString } from "class-validator";
import { sign } from '../jwt'
import User from "../users/entity";

class AuthenticatePayload {
    @IsString()
    email: string

    @IsString()
    password: string
}

@JsonController()
export default class LoginController {
    
    //create a login endpoint 
    @Post('/login')
    async authenticate(
        @Body() { email, password }: AuthenticatePayload
    ) {
        const user = await User.findOne({ where: { email } })
        if (!user) throw new BadRequestError('Invalid email and password')

        if (!await user.checkPassword(password)) throw new BadRequestError('Invalid email and password')
        
        // send back a jwt token
        const jwt = sign({ id: user.id! })
        return { jwt }
    }
}

