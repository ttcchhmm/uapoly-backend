import { Entity, Column, PrimaryColumn, OneToMany } from "typeorm";
import { Friend } from "./Friend";

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
    @Column({
        select: false, // Don't select the password when querying the database
    })
    password: string;

    /**
     * The email of the account.
     */
    @Column({
        select: false, // Don't select the email when querying the database
    })
    email: string;

    /**
     * The friend requests sent by the account.
     */
    @OneToMany(() => Friend, friend => friend.firstAccount)
    sentFriendRequests: Friend[];

    /**
     * The friend requests received by the account.
     */
    @OneToMany(() => Friend, friend => friend.secondAccount)
    receivedFriendRequests: Friend[];

    /**
     * Queries the friends of the account.
     * @returns The friends of the account.
     */
    getFriends(): Friend[] {
        return this.sentFriendRequests.filter(friend => friend.accepted).concat(
                this.receivedFriendRequests.filter(friend => friend.accepted)
            );
    }
}
