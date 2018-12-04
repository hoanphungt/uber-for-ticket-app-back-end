import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm'
import { BaseEntity } from 'typeorm/repository/BaseEntity'
import { Exclude } from 'class-transformer';
import { IsString, MinLength } from 'class-validator';
import * as bcrypt from 'bcrypt'
import Event from '../events/entity';
import Ticket from '../tickets/entity';
import Comment from '../comments/entity';

@Entity()
export default class User extends BaseEntity {

    @PrimaryGeneratedColumn()
    id?: number

    @Column('text', {nullable: true})
    firstName: string

    @Column('text', {nullable: true})
    lastName: string

    @Column('text', {nullable: false})
    email: string

    @IsString()
    @MinLength(3)
    @Column('text', {nullable: false})
    @Exclude({toPlainOnly: true})
    password: string

    //hash the password using async function
    async setPassword(raw: string) {
        const hash =await bcrypt.hash(raw, 10)
        this.password = hash
    }
    //check the newly created password
    checkPassword(raw: string): Promise<boolean> {
        return bcrypt.compare(raw, this.password)
    }

    @OneToMany(_ => Event, event => event.user)
    events: Event[]

    @OneToMany(_ => Ticket, ticket => ticket.user)
    tickets: Ticket[]

    @OneToMany(_ => Comment, comment => comment.user)
    comments: Comment[]
}