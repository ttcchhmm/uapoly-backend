/**
 * Represents an HTTP error.
 */
export class HTTPError extends Error {
    /**
     * The HTTP status code.
     */
    public status: number;

    /**
     * The message to send to the client.
     */
    public override message: string;

    /**
     * Creates a new HTTPError. 
     */
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
        this.message = message;
    }
};