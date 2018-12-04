import {Controller, Get} from 'routing-controllers'

@Controller()
export default class MainController {

    @Get("/home")
    main() {
       return {
         hello: 'Welcome to my final assignment'
       }
    }

}