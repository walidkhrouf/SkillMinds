const {
    createActivity,
    getActivities,
    participateInActivity,
  } = require('../Controllers/eventsController');
  
  
  jest.mock('../models/Activity', () => ({
    find: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
    findById: jest.fn().mockResolvedValue({ participants: [] }),
  }));
  jest.mock('jsonwebtoken', () => ({
    verify: jest.fn().mockReturnValue({ userId: 'mockUser' }),
  }));
  jest.mock('stripe', () => {
    
    const stripeMock = jest.fn(() => ({
      paymentIntents: {
        create: jest.fn().mockResolvedValue({ client_secret: 'mock_secret' }),
      },
    }));
    return stripeMock;
  });
  
  describe('Events Controller - Minimal Tests', () => {
    let req, res;
  
    beforeEach(() => {
      jest.clearAllMocks();
  
      req = {
        headers: { authorization: 'Bearer mocktoken' },
        body: { title: 'Test' },
        params: { id: 'mockId' },
      };
  
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });
  
    it('createActivity responds', async () => {
      await createActivity(req, res);
      expect(res.status).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });
  
    it('getActivities responds', async () => {
      await getActivities(req, res);
      expect(res.status).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });
  
    it('participateInActivity responds', async () => {
      await participateInActivity(req, res);
      expect(res.status).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });
  });