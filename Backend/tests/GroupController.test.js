// backend/tests/GroupController.test.js
const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../server"); // Adjust the path to your server.js file
const Group = require("../models/Groupe");
const User = require("../models/User");

// Mock GridFSBucket to avoid referencing mongoose directly in jest.mock
jest.mock("mongodb", () => {
    const originalModule = jest.requireActual("mongodb");
    const mockObjectId = jest.fn().mockImplementation(() => ({
        toString: jest.fn().mockReturnValue("mockedObjectId"),
    }));
    return {
        ...originalModule,
        GridFSBucket: jest.fn().mockImplementation(() => ({
            openUploadStream: jest.fn().mockReturnValue({
                id: mockObjectId(),
                end: jest.fn(),
                on: jest.fn((event, callback) => {
                    if (event === "finish") callback();
                }),
            }),
            openDownloadStream: jest.fn().mockReturnValue({
                pipe: jest.fn(),
                on: jest.fn((event, callback) => {
                    if (event === "error") callback(new Error("File not found"));
                }),
            }),
        })),
    };
});

describe("GroupController", () => {
    let user, token, group;

    beforeEach(async () => {

        user = await User.create({
            username: "testuser",
            email: "testuser@example.com",
            password: "password123",
            role: "learner",
        });

        // Generate a JWT token for the user
        token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "your_jwt_secret", {
            expiresIn: "1h",
        });

        // Create a group
        group = await Group.create({
            name: "Test Group",
            description: "A test group",
            privacy: "public",
            createdBy: user._id,
        });
    });

    afterEach(async () => {
        // Clear all collections after each test
        await User.deleteMany({});
        await Group.deleteMany({});
    });

    // Test createGroup
    describe("createGroup", () => {
        it("should create a group successfully", async () => {
            const response = await request(app)
                .post("/api/groups/create")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    name: "New Group",
                    description: "A new group",
                    privacy: "public",
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("message", "Group created successfully");
            expect(response.body.group).toHaveProperty("name", "New Group");
        });
    });

    // Test getAllGroups
    describe("getAllGroups", () => {
        it("should retrieve all groups with details", async () => {
            const response = await request(app)
                .get("/api/groups/all")
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(1);
            expect(response.body[0]).toHaveProperty("name", "Test Group");
            expect(response.body[0]).toHaveProperty("memberCount", 0);
            expect(response.body[0]).toHaveProperty("postCount", 0);
        });
    });

    // Test deleteGroup
    describe("deleteGroup", () => {
        it("should delete a group successfully", async () => {
            const response = await request(app)
                .delete(`/api/groups/${group._id}`)
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("message", "Group deleted successfully");


            const deletedGroup = await Group.findById(group._id);
            expect(deletedGroup).toBeNull();
        });
    });
});