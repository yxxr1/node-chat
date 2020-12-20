import {Request as RequestI} from 'express'
import {Session} from 'express-session'

export type Request = RequestI & {
    session: Session & {
        userId: string,
        name: string | null
    }
}