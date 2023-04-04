import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { Account } from "./Account";

/**
 * Represents a friend relationship in the database.
 */
@Entity()
export class Friend {
    /**
     * The login of the account representing the sender of the friend request.
     */
    @PrimaryColumn()
    firstAccountLogin: string;

    /**
     * The login of the account representing the receiver of the friend request.
     */
    @PrimaryColumn()
    secondAccountLogin: string;

    /**
     * The account representing the sender of the friend request.
     */
    @ManyToOne(() => Account, account => account.sentFriendRequests)
    firstAccount: Account;

    /**
     * The account representing the receiver of the friend request.
     */
    @ManyToOne(() => Account, account => account.receivedFriendRequests)
    secondAccount: Account;

    /**
     * Whether the friend request has been accepted.
     */
    @Column()
    accepted: boolean;
}