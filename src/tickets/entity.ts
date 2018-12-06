import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm'
import { BaseEntity } from 'typeorm/repository/BaseEntity'
import Event from '../events/entity';
import User from '../users/entity';
import Comment from '../comments/entity';


@Entity()
export default class Ticket extends BaseEntity {

    @PrimaryGeneratedColumn()
    id?: number

    @Column('float', { nullable: false })
    price: number

    @Column('text', { nullable: false })
    description: string

    @Column('text', { nullable: true })
    picture: string

    @Column('float', { nullable: false })
    risk: number

    @Column()
    createdDate: Date = new Date()

    @ManyToOne(_ => Event, event => event.tickets, {eager: true})
    event: Event

    @ManyToOne(_ => User, user => user.tickets, {eager: true})
    user: User

    @OneToMany(_ => Comment, comment => comment.ticket)
    comments: Comment
}