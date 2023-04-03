import { Entity, Column, PrimaryColumn } from "typeorm";

/**
 * Represents an account in the database.
 */
@Entity()
export class Account {
    /**
     * The login of the account.
     */
    @PrimaryColumn()
    login: string;

    /**
     * The hashed password of the account.
     */
    @Column()
    password: string;

    /**
     * The email of the account.
     */
    @Column()
    email: string;
}
