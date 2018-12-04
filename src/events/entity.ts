import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm'
import { BaseEntity } from 'typeorm/repository/BaseEntity'
import User from '../users/entity';
import Ticket from '../tickets/entity';

@Entity()
export default class Event extends BaseEntity {

    @PrimaryGeneratedColumn()
    id?: number

    @Column('text', { nullable: false })
    name: string

    @Column('text', { nullable: true })
    description: string

    @Column('text', { nullable: true })
    picture: string

    @Column('text', { nullable: false })
    start: string

    @Column('text', { nullable: false })
    end: string

    @ManyToOne(_ => User, user => user.events, {eager: true})
    user: User

    @OneToMany(_ => Ticket, ticket => ticket.event)
    tickets: Ticket[]
}