import { Router } from 'express';
import Joi from 'joi';
import { AppDataSource } from '../config/database';
import { ServerInstance } from '../models/ServerInstance';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/auth';
import { WingsService } from '../services/WingsService';
import { io } from '../index';

const router = Router();
const wingsService = new WingsService();

const playerActionSchema = Joi.object({
  action: Joi.string().valid('kick', 'ban', 'tempban', 'unban', 'op', 'deop', 'whitelist', 'unwhitelist', 'mute', 'unmute').required(),
  reason: Joi.string().max(255).optional(),
  duration: Joi.number().min(1).optional() // For tempban, in minutes
});

const sendMessageSchema = Joi.object({
  message: Joi.string().max(255).required(),
  player: Joi.string().optional() // If not provided, broadcast to all
});

const commandSchema = Joi.object({
  command: Joi.string().max(255).required()
});

router.use(authenticateToken);

// Get online players for a server
router.get('/:serverId/online', async (req: AuthenticatedRequest, res) => {
  try {
    const serverRepository = AppDataSource.getRepository(ServerInstance);
    const server = await serverRepository.findOne({ where: { id: req.params.serverId } });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (req.user!.role === 'user' && server.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    try {
      const players = await wingsService.getOnlinePlayers(server.wingsUuid!);
      
      res.json({
        serverId: server.id,
        serverName: server.name,
        onlineCount: players.length,
        maxPlayers: server.serverProperties?.['max-players'] || 20,
        players: players.map(player => ({
          uuid: player.uuid,
          name: player.name,
          ip: player.ip,
          joinedAt: player.joinedAt,
          ping: player.ping,
          gamemode: player.gamemode,
          health: player.health,
          food: player.food,
          level: player.level,
          location: player.location
        }))
      });
    } catch (wingsError) {
      console.error('Wings get players error:', wingsError);
      res.json({
        serverId: server.id,
        serverName: server.name,
        onlineCount: 0,
        maxPlayers: server.serverProperties?.['max-players'] || 20,
        players: []
      });
    }
  } catch (error) {
    console.error('Get online players error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get player statistics and history
router.get('/:serverId/stats/:playerName', async (req: AuthenticatedRequest, res) => {
  try {
    const serverRepository = AppDataSource.getRepository(ServerInstance);
    const server = await serverRepository.findOne({ where: { id: req.params.serverId } });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (req.user!.role === 'user' && server.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    try {
      const playerStats = await wingsService.getPlayerStats(server.wingsUuid!, req.params.playerName);
      
      res.json({
        serverId: server.id,
        playerName: req.params.playerName,
        stats: playerStats
      });
    } catch (wingsError) {
      console.error('Wings get player stats error:', wingsError);
      res.status(404).json({ error: 'Player not found or stats unavailable' });
    }
  } catch (error) {
    console.error('Get player stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Perform action on player
router.post('/:serverId/action/:playerName', async (req: AuthenticatedRequest, res) => {
  try {
    const { error } = playerActionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { action, reason, duration } = req.body;
    const serverRepository = AppDataSource.getRepository(ServerInstance);
    const server = await serverRepository.findOne({ where: { id: req.params.serverId } });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (req.user!.role === 'user' && server.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const playerName = req.params.playerName;

    try {
      let command = '';
      let actionMessage = '';

      switch (action) {
        case 'kick':
          command = `kick ${playerName}${reason ? ` ${reason}` : ''}`;
          actionMessage = `Kicked player ${playerName}`;
          break;
        case 'ban':
          command = `ban ${playerName}${reason ? ` ${reason}` : ''}`;
          actionMessage = `Banned player ${playerName}`;
          break;
        case 'tempban':
          if (!duration) {
            return res.status(400).json({ error: 'Duration is required for temporary ban' });
          }
          command = `tempban ${playerName} ${duration}m${reason ? ` ${reason}` : ''}`;
          actionMessage = `Temporarily banned player ${playerName} for ${duration} minutes`;
          break;
        case 'unban':
          command = `unban ${playerName}`;
          actionMessage = `Unbanned player ${playerName}`;
          break;
        case 'op':
          command = `op ${playerName}`;
          actionMessage = `Gave operator privileges to ${playerName}`;
          break;
        case 'deop':
          command = `deop ${playerName}`;
          actionMessage = `Removed operator privileges from ${playerName}`;
          break;
        case 'whitelist':
          command = `whitelist add ${playerName}`;
          actionMessage = `Added ${playerName} to whitelist`;
          break;
        case 'unwhitelist':
          command = `whitelist remove ${playerName}`;
          actionMessage = `Removed ${playerName} from whitelist`;
          break;
        case 'mute':
          command = `mute ${playerName}${duration ? ` ${duration}m` : ''}${reason ? ` ${reason}` : ''}`;
          actionMessage = `Muted player ${playerName}`;
          break;
        case 'unmute':
          command = `unmute ${playerName}`;
          actionMessage = `Unmuted player ${playerName}`;
          break;
        default:
          return res.status(400).json({ error: 'Invalid action' });
      }

      await wingsService.sendCommand(server.wingsUuid!, command);

      // Emit real-time update to connected clients
      io.to(`server-${server.id}`).emit('player-action', {
        serverId: server.id,
        playerName,
        action,
        reason,
        duration,
        performedBy: req.user!.username,
        timestamp: new Date().toISOString()
      });

      res.json({
        message: actionMessage,
        action,
        playerName,
        command
      });
    } catch (wingsError) {
      console.error('Wings player action error:', wingsError);
      res.status(503).json({ error: 'Failed to execute player action' });
    }
  } catch (error) {
    console.error('Player action error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send message to player or broadcast
router.post('/:serverId/message', async (req: AuthenticatedRequest, res) => {
  try {
    const { error } = sendMessageSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { message, player } = req.body;
    const serverRepository = AppDataSource.getRepository(ServerInstance);
    const server = await serverRepository.findOne({ where: { id: req.params.serverId } });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (req.user!.role === 'user' && server.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    try {
      const command = player 
        ? `tell ${player} ${message}`
        : `say ${message}`;

      await wingsService.sendCommand(server.wingsUuid!, command);

      // Emit real-time update
      io.to(`server-${server.id}`).emit('message-sent', {
        serverId: server.id,
        message,
        recipient: player || 'all',
        sender: req.user!.username,
        timestamp: new Date().toISOString()
      });

      res.json({
        message: player 
          ? `Message sent to ${player}`
          : 'Message broadcasted to all players',
        recipient: player || 'all',
        content: message
      });
    } catch (wingsError) {
      console.error('Wings send message error:', wingsError);
      res.status(503).json({ error: 'Failed to send message' });
    }
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Execute custom command
router.post('/:serverId/command', async (req: AuthenticatedRequest, res) => {
  try {
    const { error } = commandSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { command } = req.body;
    const serverRepository = AppDataSource.getRepository(ServerInstance);
    const server = await serverRepository.findOne({ where: { id: req.params.serverId } });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (req.user!.role === 'user' && server.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    try {
      await wingsService.sendCommand(server.wingsUuid!, command);

      // Emit real-time update
      io.to(`server-${server.id}`).emit('command-executed', {
        serverId: server.id,
        command,
        executedBy: req.user!.username,
        timestamp: new Date().toISOString()
      });

      res.json({
        message: 'Command executed successfully',
        command
      });
    } catch (wingsError) {
      console.error('Wings command error:', wingsError);
      res.status(503).json({ error: 'Failed to execute command' });
    }
  } catch (error) {
    console.error('Execute command error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get whitelist
router.get('/:serverId/whitelist', async (req: AuthenticatedRequest, res) => {
  try {
    const serverRepository = AppDataSource.getRepository(ServerInstance);
    const server = await serverRepository.findOne({ where: { id: req.params.serverId } });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (req.user!.role === 'user' && server.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    try {
      const whitelist = await wingsService.getWhitelist(server.wingsUuid!);
      
      res.json({
        serverId: server.id,
        enabled: server.serverProperties?.['white-list'] || false,
        players: whitelist
      });
    } catch (wingsError) {
      console.error('Wings get whitelist error:', wingsError);
      res.json({
        serverId: server.id,
        enabled: server.serverProperties?.['white-list'] || false,
        players: []
      });
    }
  } catch (error) {
    console.error('Get whitelist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get banned players
router.get('/:serverId/bans', async (req: AuthenticatedRequest, res) => {
  try {
    const serverRepository = AppDataSource.getRepository(ServerInstance);
    const server = await serverRepository.findOne({ where: { id: req.params.serverId } });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (req.user!.role === 'user' && server.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    try {
      const bans = await wingsService.getBanList(server.wingsUuid!);
      
      res.json({
        serverId: server.id,
        bans
      });
    } catch (wingsError) {
      console.error('Wings get bans error:', wingsError);
      res.json({
        serverId: server.id,
        bans: []
      });
    }
  } catch (error) {
    console.error('Get bans error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;