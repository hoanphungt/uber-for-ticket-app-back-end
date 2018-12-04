import 'reflect-metadata'
import { createKoaServer, Action } from "routing-controllers"
import setupDb from './db'
import EventsController from './events/controller';
import UsersController from './users/controller';
import LoginController from './logins/controller';
import TicketsController from './tickets/controller';
import { verify } from './jwt';
import User from './users/entity';

const port = process.env.PORT || 4000

const app = createKoaServer({
  cors: true,
  controllers: [
    EventsController,
    UsersController,
    TicketsController,
    LoginController
  ],
  authorizationChecker: (action: Action) => {
    const header: string = action.request.headers.authorization

    if (header && header.startsWith('Bearer ')) {
      const [, token] = header.split(' ')
      return !!(token && verify(token))
    }

    return false
  },
  currentUserChecker: async (action: Action) => {
    const header: string = action.request.headers.authorization
    if (header && header.startsWith('Bearer ')) {
      const [, token] = header.split(' ')

      if (token) {
        const { id } = verify(token).data
        return User.findOne(id)
      }
    }
    return undefined
  }
})

setupDb()
  .then(_ =>
    app.listen(port, () => console.log(`Listening on port ${port}`))
  )
  .catch(err => console.error(err))