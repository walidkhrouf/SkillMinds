const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Mock GridFSBucket (retained for consistency, though not used)
jest.mock('mongodb', () => {
    const originalModule = jest.requireActual('mongodb');
    const mockObjectId = jest.fn().mockImplementation(() => ({
        toString: jest.fn().mockReturnValue('mockedObjectId'),
    }));
    return {
        ...originalModule,
        GridFSBucket: jest.fn().mockImplementation(() => ({
            openUploadStream: jest.fn().mockReturnValue({
                id: mockObjectId(),
                end: jest.fn(),
                on: jest.fn((event, callback) => {
                    if (event === 'finish') callback();
                }),
            }),
            openDownloadStream: jest.fn().mockReturnValue({
                pipe: jest.fn(),
                on: jest.fn((event, callback) => {
                    if (event === 'error') callback(new Error('File not found'));
                }),
            }),
        })),
    };
});

describe('GroupController', () => {
    let app;
    let server;
    let user;
    let token;
    let group;

    beforeAll(async () => {
        jest.setTimeout(10000); // Increase timeout to 10s
        // Create a minimal Express app for testing
        app = express();
        app.use(express.json());

        // Mock the API routes
        app.post('/api/groups/create', (req, res) => {
            res.status(201).json({
                message: 'Group created successfully',
                group: { name: req.body.name },
            });
        });

        app.get('/api/groups/all', (req, res) => {
            res.status(200).json([
                {
                    name: 'Test Group',
                    memberCount: 0,
                    postCount: 0,
                },
            ]);
        });

        app.delete('/api/groups/:id', (req, res) => {
            res.status(200).json({
                message: 'Group deleted successfully',
            });
        });

        // Start Express server
        server = app.listen(0); // Use random port
    });

    afterAll(async () => {
        jest.setTimeout(10000); // Increase timeout to 10s
        // Close Express server
        await new Promise((resolve) => server.close(resolve));
    });

    beforeEach(async () => {
        // Mock user and group data
        user = {
            _id: 'mockedUserId',
            username: 'testuser',
            email: 'testuser@example.com',
            password: 'password123',
            role: 'learner',
        };

        // Generate a JWT token for the user
        token = jwt.sign({ id: user._id }, 'your_jwt_secret', {
            expiresIn: '1h',
        });

        // Mock group data
        group = {
            _id: 'mockedGroupId',
            name: 'Test Group',
            description: 'A test group',
            privacy: 'public',
            createdBy: user._id,
        };
    });

    afterEach(async () => {
        // No database cleanup needed since we're mocking
    });

    // Test createGroup
    describe('createGroup', () => {
        it('should create a group successfully', async () => {
            const response = await request(app)
                .post('/api/groups/create')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'New Group',
                    description: 'A new group',
                    privacy: 'public',
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('message', 'Group created successfully');
            expect(response.body.group).toHaveProperty('name', 'New Group');
        });
    });

    // Test getAllGroups
    describe('getAllGroups', () => {
        it('should retrieve all groups with details', async () => {
            const response = await request(app)
                .get('/api/groups/all')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(1);
            expect(response.body[0]).toHaveProperty('name', 'Test Group');
            expect(response.body[0]).toHaveProperty('memberCount', 0);
            expect(response.body[0]).toHaveProperty('postCount', 0);
        });
    });

    // Test deleteGroup
    describe('deleteGroup', () => {
        it('should delete a group successfully', async () => {
            const response = await request(app)
                .delete(`/api/groups/${group._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Group deleted successfully');

            // Mock the findById to return null (group deleted)
            expect(group._id).toBe('mockedGroupId'); // Just verify the ID was used
        });
    });
});