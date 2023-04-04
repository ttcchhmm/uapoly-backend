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
    sentFriendRequests: Promise<Friend[]>;

    /**
     * The friend requests received by the account.
     */
    @OneToMany(() => Friend, friend => friend.secondAccount)
    receivedFriendRequests: Promise<Friend[]>;

    /**
     * Queries the friends of the account.
     * @returns The friends of the account.
     */
    async getFriends() {
        const sent = await this.sentFriendRequests;
        const received = await this.receivedFriendRequests;

        return sent.filter(friend => friend.accepted).concat(
                received.filter(friend => friend.accepted)
            );
    }

    async isFriendWith(account: Account) {
        return (await this.getFriends()).some(friend => friend.firstAccountLogin === account.login || friend.secondAccountLogin === account.login);
    }
}
