const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("QueuePass Smart Contract", function () {
  let QueuePass;
  let queuePass;
  let owner, customer1, customer2, customer3, stranger;

  beforeEach(async function () {
    [owner, customer1, customer2, customer3, stranger] = await ethers.getSigners();
    QueuePass = await ethers.getContractFactory("QueuePass");
    queuePass = await QueuePass.deploy();
    await queuePass.waitForDeployment();
  });

  describe("Queue Creation", function () {
    it("should allow creating a queue and emit QueueCreated", async function () {
      const tx = await queuePass.connect(owner).createQueue("Dr. Smith Clinic", "General consultation queue");
      const receipt = await tx.wait();

      expect(await queuePass.getQueueCount()).to.equal(1n);

      const status = await queuePass.getQueueStatus(1);
      expect(status.id).to.equal(1n);
      expect(status.owner).to.equal(owner.address);
      expect(status.name).to.equal("Dr. Smith Clinic");
      expect(status.description).to.equal("General consultation queue");
      expect(status.status).to.equal(0); // 0 = Active
      expect(status.totalTickets).to.equal(0n);
      expect(status.waitingCount).to.equal(0n);
    });

    it("should reject queue creation with empty name", async function () {
      await expect(
        queuePass.connect(owner).createQueue("", "No name")
      ).to.be.revertedWithCustomError(queuePass, "EmptyQueueName");
    });

    it("should increment queueId sequentially", async function () {
      await queuePass.connect(owner).createQueue("Queue 1", "Desc 1");
      await queuePass.connect(owner).createQueue("Queue 2", "Desc 2");
      expect(await queuePass.getQueueCount()).to.equal(2n);

      const q1 = await queuePass.getQueueStatus(1);
      const q2 = await queuePass.getQueueStatus(2);
      expect(q1.id).to.equal(1n);
      expect(q2.id).to.equal(2n);
    });
  });

  describe("Joining Queue & Ticket Numbering", function () {
    beforeEach(async function () {
      await queuePass.connect(owner).createQueue("Coffee Shop", "Quick orders");
    });

    it("should issue tickets sequentially starting from 1", async function () {
      await queuePass.connect(customer1).joinQueue(1);
      let ticket1 = await queuePass.getTicket(1, 1);
      expect(ticket1.ticketId).to.equal(1n);
      expect(ticket1.customer).to.equal(customer1.address);
      expect(ticket1.status).to.equal(1); // 1 = Waiting

      await queuePass.connect(customer2).joinQueue(1);
      let ticket2 = await queuePass.getTicket(1, 2);
      expect(ticket2.ticketId).to.equal(2n);
      expect(ticket2.customer).to.equal(customer2.address);
      expect(ticket2.status).to.equal(1); // 1 = Waiting

      const qStatus = await queuePass.getQueueStatus(1);
      expect(qStatus.totalTickets).to.equal(2n);
      expect(qStatus.waitingCount).to.equal(2n);
    });

    it("should prevent duplicate active tickets in the same queue", async function () {
      await queuePass.connect(customer1).joinQueue(1);

      await expect(
        queuePass.connect(customer1).joinQueue(1)
      ).to.be.revertedWithCustomError(queuePass, "AlreadyHasActiveTicket");
    });

    it("should allow a customer to join different queues concurrently", async function () {
      await queuePass.connect(owner).createQueue("Bakery", "Fresh bread");
      await queuePass.connect(customer1).joinQueue(1);
      await expect(queuePass.connect(customer1).joinQueue(2)).to.not.be.reverted;

      const userTicketQ1 = await queuePass.getUserTicketInfo(1, customer1.address);
      const userTicketQ2 = await queuePass.getUserTicketInfo(2, customer1.address);
      expect(userTicketQ1.hasActiveTicket).to.be.true;
      expect(userTicketQ2.hasActiveTicket).to.be.true;
    });

    it("should revert if joining a non-existent queue", async function () {
      await expect(
        queuePass.connect(customer1).joinQueue(999)
      ).to.be.revertedWithCustomError(queuePass, "QueueNotFound");
    });
  });

  describe("Calling Next Customer & Access Control", function () {
    beforeEach(async function () {
      await queuePass.connect(owner).createQueue("Barber Shop", "Haircuts");
      await queuePass.connect(customer1).joinQueue(1);
      await queuePass.connect(customer2).joinQueue(1);
    });

    it("should allow owner to call next waiting customer", async function () {
      const tx = await queuePass.connect(owner).callNext(1);
      await expect(tx)
        .to.emit(queuePass, "TicketCalled")
        .withArgs(1n, 1n, customer1.address, 1n, (await ethers.provider.getBlock("latest")).timestamp);

      const ticket1 = await queuePass.getTicket(1, 1);
      expect(ticket1.status).to.equal(2); // 2 = Called

      const status = await queuePass.getQueueStatus(1);
      expect(status.currentTicketServed).to.equal(1n);
      expect(status.waitingCount).to.equal(1n);
    });

    it("should reject callNext from non-owner", async function () {
      await expect(
        queuePass.connect(stranger).callNext(1)
      ).to.be.revertedWithCustomError(queuePass, "NotQueueOwner");
    });

    it("should skip cancelled tickets when calling next", async function () {
      // Customer 1 leaves queue
      await queuePass.connect(customer1).leaveQueue(1);

      // Owner calls next -> should skip ticket 1 (Cancelled) and call ticket 2
      await queuePass.connect(owner).callNext(1);

      const ticket2 = await queuePass.getTicket(1, 2);
      expect(ticket2.status).to.equal(2); // Called

      const status = await queuePass.getQueueStatus(1);
      expect(status.currentTicketServed).to.equal(2n);
    });

    it("should revert callNext when no customers are waiting", async function () {
      await queuePass.connect(owner).callNext(1); // calls ticket 1
      await queuePass.connect(owner).callNext(1); // calls ticket 2

      await expect(
        queuePass.connect(owner).callNext(1)
      ).to.be.revertedWithCustomError(queuePass, "NoWaitingCustomers");
    });
  });

  describe("Marking Served & Status Transitions", function () {
    beforeEach(async function () {
      await queuePass.connect(owner).createQueue("DMV Service", "Driver licenses");
      await queuePass.connect(customer1).joinQueue(1);
    });

    it("should only allow owner to mark served", async function () {
      await queuePass.connect(owner).callNext(1);

      await expect(
        queuePass.connect(stranger).markServed(1, 1)
      ).to.be.revertedWithCustomError(queuePass, "NotQueueOwner");
    });

    it("should not allow marking served if ticket is still Waiting", async function () {
      // Ticket 1 has not been called yet
      await expect(
        queuePass.connect(owner).markServed(1, 1)
      ).to.be.revertedWithCustomError(queuePass, "InvalidTicketTransition");
    });

    it("should transition ticket to Served and allow customer to join again", async function () {
      await queuePass.connect(owner).callNext(1);
      await queuePass.connect(owner).markServed(1, 1);

      const ticket = await queuePass.getTicket(1, 1);
      expect(ticket.status).to.equal(3); // 3 = Served

      const status = await queuePass.getQueueStatus(1);
      expect(status.servedCount).to.equal(1n);

      // Customer should no longer have an active ticket
      const userTicketInfo = await queuePass.getUserTicketInfo(1, customer1.address);
      expect(userTicketInfo.hasActiveTicket).to.be.false;

      // Customer can now join again and get ticket 2
      await expect(queuePass.connect(customer1).joinQueue(1)).to.not.be.reverted;
      const ticket2 = await queuePass.getTicket(1, 2);
      expect(ticket2.ticketId).to.equal(2n);
    });
  });

  describe("Leaving Queue (Customer Cancellation)", function () {
    beforeEach(async function () {
      await queuePass.connect(owner).createQueue("Restaurant", "Table waiting");
      await queuePass.connect(customer1).joinQueue(1);
    });

    it("should allow customer to leave their active ticket and update counts", async function () {
      await queuePass.connect(customer1).leaveQueue(1);

      const ticket = await queuePass.getTicket(1, 1);
      expect(ticket.status).to.equal(4); // 4 = Cancelled

      const status = await queuePass.getQueueStatus(1);
      expect(status.waitingCount).to.equal(0n);
      expect(status.cancelledCount).to.equal(1n);

      const userTicketInfo = await queuePass.getUserTicketInfo(1, customer1.address);
      expect(userTicketInfo.hasActiveTicket).to.be.false;
    });

    it("should revert if user has no active ticket to leave", async function () {
      await expect(
        queuePass.connect(stranger).leaveQueue(1)
      ).to.be.revertedWithCustomError(queuePass, "NoActiveTicket");
    });

    it("should revert if ticket was already Called", async function () {
      await queuePass.connect(owner).callNext(1);

      await expect(
        queuePass.connect(customer1).leaveQueue(1)
      ).to.be.revertedWithCustomError(queuePass, "InvalidTicketTransition");
    });
  });

  describe("Queue Closure", function () {
    beforeEach(async function () {
      await queuePass.connect(owner).createQueue("Post Office", "Parcel dispatch");
    });

    it("should allow only owner to close queue", async function () {
      await expect(
        queuePass.connect(stranger).closeQueue(1)
      ).to.be.revertedWithCustomError(queuePass, "NotQueueOwner");

      await queuePass.connect(owner).closeQueue(1);
      const status = await queuePass.getQueueStatus(1);
      expect(status.status).to.equal(1); // 1 = Closed
    });

    it("should prevent joining a closed queue", async function () {
      await queuePass.connect(owner).closeQueue(1);

      await expect(
        queuePass.connect(customer1).joinQueue(1)
      ).to.be.revertedWithCustomError(queuePass, "QueueNotActive");
    });

    it("should revert if closing an already closed queue", async function () {
      await queuePass.connect(owner).closeQueue(1);

      await expect(
        queuePass.connect(owner).closeQueue(1)
      ).to.be.revertedWithCustomError(queuePass, "QueueAlreadyClosed");
    });
  });

  describe("Position in Line Calculation", function () {
    it("should correctly compute position in line for waiting customers", async function () {
      await queuePass.connect(owner).createQueue("Pharmacy", "Prescriptions");
      await queuePass.connect(customer1).joinQueue(1); // ticket 1
      await queuePass.connect(customer2).joinQueue(1); // ticket 2
      await queuePass.connect(customer3).joinQueue(1); // ticket 3

      expect(await queuePass.getPositionInLine(1, 1)).to.equal(1n);
      expect(await queuePass.getPositionInLine(1, 2)).to.equal(2n);
      expect(await queuePass.getPositionInLine(1, 3)).to.equal(3n);

      // Customer 2 leaves
      await queuePass.connect(customer2).leaveQueue(1);

      // Customer 3 is now 2nd in line
      expect(await queuePass.getPositionInLine(1, 3)).to.equal(2n);
      // Cancelled ticket has 0 position
      expect(await queuePass.getPositionInLine(1, 2)).to.equal(0n);
    });
  });
});

