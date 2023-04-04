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
     * Whether the friend request has been accepted.
     */
    @Column({select: true})
    accepted: boolean;

    /**
     * The account representing the sender of the friend request.
     */
    @ManyToOne(() => Account, account => account.sentFriendRequests, {eager: false})
    firstAccount: Promise<Account>;

    /**
     * The account representing the receiver of the friend request.
     */
    @ManyToOne(() => Account, account => account.receivedFriendRequests, {eager: false})
    secondAccount: Promise<Account>;
}