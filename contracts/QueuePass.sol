// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title QueuePass
 * @notice Decentralized Queue Management Smart Contract for BOT Chain
 * @dev Manages queues, customer ticket issuance, calling next tickets, serving, and cancellations.
 */
contract QueuePass {
    enum QueueStatus {
        Active,
        Closed
    }

    enum TicketStatus {
        None,
        Waiting,
        Called,
        Served,
        Cancelled
    }

    struct Queue {
        uint256 id;
        address owner;
        string name;
        string description;
        QueueStatus status;
        uint256 totalTickets;
        uint256 currentTicketServed; // Last called/served ticket number
        uint256 nextTicketToCall;    // Internal pointer to search for next waiting ticket
        uint256 waitingCount;
        uint256 servedCount;
        uint256 cancelledCount;
        uint256 createdAt;
    }

    struct Ticket {
        uint256 ticketId;
        uint256 queueId;
        address customer;
        TicketStatus status;
        uint256 joinedAt;
        uint256 updatedAt;
    }

    // Queue counter
    uint256 private _queueIdCounter;

    // queueId => Queue
    mapping(uint256 => Queue) public queues;

    // queueId => ticketId => Ticket
    mapping(uint256 => mapping(uint256 => Ticket)) public tickets;

    // queueId => customer address => active ticketId (0 if none)
    mapping(uint256 => mapping(address => uint256)) public userActiveTicket;

    // Events
    event QueueCreated(
        uint256 indexed queueId,
        address indexed owner,
        string name,
        uint256 timestamp
    );

    event TicketIssued(
        uint256 indexed queueId,
        uint256 indexed ticketId,
        address indexed customer,
        uint256 ticketNumber,
        uint256 timestamp
    );

    event TicketCalled(
        uint256 indexed queueId,
        uint256 indexed ticketId,
        address indexed customer,
        uint256 ticketNumber,
        uint256 timestamp
    );

    event CustomerServed(
        uint256 indexed queueId,
        uint256 indexed ticketId,
        address indexed customer,
        uint256 timestamp
    );

    event TicketCancelled(
        uint256 indexed queueId,
        uint256 indexed ticketId,
        address indexed customer,
        uint256 timestamp
    );

    event QueueClosed(
        uint256 indexed queueId,
        address indexed owner,
        uint256 timestamp
    );

    // Custom Errors
    error QueueNotFound();
    error QueueNotActive();
    error QueueAlreadyClosed();
    error NotQueueOwner();
    error EmptyQueueName();
    error AlreadyHasActiveTicket();
    error NoActiveTicket();
    error TicketNotFound();
    error InvalidTicketTransition();
    error NoWaitingCustomers();

    modifier onlyQueueOwner(uint256 queueId) {
        if (queues[queueId].id == 0) revert QueueNotFound();
        if (queues[queueId].owner != msg.sender) revert NotQueueOwner();
        _;
    }

    modifier queueMustBeActive(uint256 queueId) {
        if (queues[queueId].id == 0) revert QueueNotFound();
        if (queues[queueId].status != QueueStatus.Active) revert QueueNotActive();
        _;
    }

    /**
     * @notice Creates a new queue on BOT Chain
     * @param name Name / Title of the queue
     * @param description Brief description or business note
     * @return queueId The newly generated unique queue ID
     */
    function createQueue(
        string calldata name,
        string calldata description
    ) external returns (uint256 queueId) {
        if (bytes(name).length == 0) revert EmptyQueueName();

        _queueIdCounter++;
        queueId = _queueIdCounter;

        queues[queueId] = Queue({
            id: queueId,
            owner: msg.sender,
            name: name,
            description: description,
            status: QueueStatus.Active,
            totalTickets: 0,
            currentTicketServed: 0,
            nextTicketToCall: 1,
            waitingCount: 0,
            servedCount: 0,
            cancelledCount: 0,
            createdAt: block.timestamp
        });

        emit QueueCreated(queueId, msg.sender, name, block.timestamp);
    }

    /**
     * @notice Customer joins an active queue and receives the next sequential ticket number
     * @param queueId The ID of the queue to join
     * @return ticketId The ticket number assigned
     */
    function joinQueue(uint256 queueId) external queueMustBeActive(queueId) returns (uint256 ticketId) {
        if (userActiveTicket[queueId][msg.sender] != 0) {
            revert AlreadyHasActiveTicket();
        }

        Queue storage queue = queues[queueId];
        queue.totalTickets++;
        ticketId = queue.totalTickets;

        tickets[queueId][ticketId] = Ticket({
            ticketId: ticketId,
            queueId: queueId,
            customer: msg.sender,
            status: TicketStatus.Waiting,
            joinedAt: block.timestamp,
            updatedAt: block.timestamp
        });

        userActiveTicket[queueId][msg.sender] = ticketId;
        queue.waitingCount++;

        emit TicketIssued(queueId, ticketId, msg.sender, ticketId, block.timestamp);
    }

    /**
     * @notice Queue owner calls the next waiting customer in line
     * @param queueId The ID of the queue
     * @return ticketId The ticket ID that was called
     */
    function callNext(uint256 queueId) external onlyQueueOwner(queueId) queueMustBeActive(queueId) returns (uint256 ticketId) {
        Queue storage queue = queues[queueId];

        uint256 pointer = queue.nextTicketToCall;
        while (pointer <= queue.totalTickets && tickets[queueId][pointer].status != TicketStatus.Waiting) {
            pointer++;
        }

        if (pointer > queue.totalTickets) {
            revert NoWaitingCustomers();
        }

        Ticket storage ticket = tickets[queueId][pointer];
        ticket.status = TicketStatus.Called;
        ticket.updatedAt = block.timestamp;

        queue.currentTicketServed = pointer;
        queue.nextTicketToCall = pointer + 1;
        queue.waitingCount--;

        emit TicketCalled(queueId, pointer, ticket.customer, pointer, block.timestamp);
        return pointer;
    }

    /**
     * @notice Queue owner marks a called customer as served
     * @param queueId The ID of the queue
     * @param ticketId The ticket ID to mark as served
     */
    function markServed(uint256 queueId, uint256 ticketId) external onlyQueueOwner(queueId) {
        if (ticketId == 0 || ticketId > queues[queueId].totalTickets) revert TicketNotFound();

        Ticket storage ticket = tickets[queueId][ticketId];
        if (ticket.status != TicketStatus.Called) {
            revert InvalidTicketTransition();
        }

        ticket.status = TicketStatus.Served;
        ticket.updatedAt = block.timestamp;

        Queue storage queue = queues[queueId];
        queue.servedCount++;

        // Clear active ticket for customer
        userActiveTicket[queueId][ticket.customer] = 0;

        emit CustomerServed(queueId, ticketId, ticket.customer, block.timestamp);
    }

    /**
     * @notice Customer leaves their active ticket in the queue
     * @param queueId The ID of the queue
     */
    function leaveQueue(uint256 queueId) external {
        uint256 ticketId = userActiveTicket[queueId][msg.sender];
        if (ticketId == 0) revert NoActiveTicket();

        Ticket storage ticket = tickets[queueId][ticketId];
        if (ticket.status != TicketStatus.Waiting) {
            revert InvalidTicketTransition();
        }

        ticket.status = TicketStatus.Cancelled;
        ticket.updatedAt = block.timestamp;

        Queue storage queue = queues[queueId];
        queue.waitingCount--;
        queue.cancelledCount++;

        userActiveTicket[queueId][msg.sender] = 0;

        emit TicketCancelled(queueId, ticketId, msg.sender, block.timestamp);
    }

    /**
     * @notice Queue owner closes an active queue
     * @param queueId The ID of the queue to close
     */
    function closeQueue(uint256 queueId) external onlyQueueOwner(queueId) {
        Queue storage queue = queues[queueId];
        if (queue.status == QueueStatus.Closed) {
            revert QueueAlreadyClosed();
        }

        queue.status = QueueStatus.Closed;
        emit QueueClosed(queueId, msg.sender, block.timestamp);
    }

    // --- View Functions ---

    /**
     * @notice Returns complete status of a queue
     */
    function getQueueStatus(uint256 queueId) external view returns (
        uint256 id,
        address owner,
        string memory name,
        string memory description,
        QueueStatus status,
        uint256 totalTickets,
        uint256 currentTicketServed,
        uint256 waitingCount,
        uint256 servedCount,
        uint256 cancelledCount,
        uint256 createdAt
    ) {
        Queue storage q = queues[queueId];
        if (q.id == 0) revert QueueNotFound();

        return (
            q.id,
            q.owner,
            q.name,
            q.description,
            q.status,
            q.totalTickets,
            q.currentTicketServed,
            q.waitingCount,
            q.servedCount,
            q.cancelledCount,
            q.createdAt
        );
    }

    /**
     * @notice Returns total number of queues created
     */
    function getQueueCount() external view returns (uint256) {
        return _queueIdCounter;
    }

    /**
     * @notice Returns full Ticket information
     */
    function getTicket(uint256 queueId, uint256 ticketId) external view returns (Ticket memory) {
        if (ticketId == 0 || ticketId > queues[queueId].totalTickets) revert TicketNotFound();
        return tickets[queueId][ticketId];
    }

    /**
     * @notice Returns the caller's active ticket details if any
     */
    function getUserTicketInfo(uint256 queueId, address user) external view returns (
        bool hasActiveTicket,
        Ticket memory ticket
    ) {
        uint256 ticketId = userActiveTicket[queueId][user];
        if (ticketId == 0) {
            return (false, Ticket(0, queueId, address(0), TicketStatus.None, 0, 0));
        }
        return (true, tickets[queueId][ticketId]);
    }

    /**
     * @notice Returns the customer's position in line (number of waiting people ahead + 1)
     */
    function getPositionInLine(uint256 queueId, uint256 ticketId) external view returns (uint256 position) {
        if (ticketId == 0 || ticketId > queues[queueId].totalTickets) revert TicketNotFound();
        Ticket storage target = tickets[queueId][ticketId];
        if (target.status != TicketStatus.Waiting) {
            return 0; // Not waiting (already called, served, or cancelled)
        }

        uint256 count = 1;
        for (uint256 i = 1; i < ticketId; i++) {
            if (tickets[queueId][i].status == TicketStatus.Waiting) {
                count++;
            }
        }
        return count;
    }

    /**
     * @notice Batch fetch multiple queues for directory browsing
     */
    function getQueues(uint256 startId, uint256 count) external view returns (Queue[] memory) {
        if (startId == 0 || startId > _queueIdCounter) {
            return new Queue[](0);
        }

        uint256 end = startId + count - 1;
        if (end > _queueIdCounter) {
            end = _queueIdCounter;
        }

        uint256 total = end - startId + 1;
        Queue[] memory result = new Queue[](total);
        for (uint256 i = 0; i < total; i++) {
            result[i] = queues[startId + i];
        }
        return result;
    }

    /**
     * @notice Batch fetch tickets for business dashboard
     */
    function getQueueTickets(uint256 queueId, uint256 startTicketId, uint256 count) external view returns (Ticket[] memory) {
        Queue storage q = queues[queueId];
        if (q.id == 0) revert QueueNotFound();
        if (startTicketId == 0 || startTicketId > q.totalTickets) {
            return new Ticket[](0);
        }

        uint256 end = startTicketId + count - 1;
        if (end > q.totalTickets) {
            end = q.totalTickets;
        }

        uint256 total = end - startTicketId + 1;
        Ticket[] memory result = new Ticket[](total);
        for (uint256 i = 0; i < total; i++) {
            result[i] = tickets[queueId][startTicketId + i];
        }
        return result;
    }
}

