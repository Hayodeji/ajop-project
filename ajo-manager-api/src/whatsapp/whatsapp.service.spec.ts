import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'
import { WhatsAppService } from './whatsapp.service'
import { ReminderLogEntity } from '../database/entities/reminder-log.entity'

jest.mock('axios')

describe('WhatsAppService', () => {
  let service: WhatsAppService
  let configService: ConfigService
  let reminderRepo: any

  const mockConfigService = {
    get: jest.fn(),
  }

  const mockReminderRepo = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockResolvedValue({}),
    createQueryBuilder: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
    }),
  }

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsAppService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: getRepositoryToken(ReminderLogEntity), useValue: mockReminderRepo },
      ],
    }).compile()

    service = module.get<WhatsAppService>(WhatsAppService)
    configService = module.get<ConfigService>(ConfigService)
    reminderRepo = module.get(getRepositoryToken(ReminderLogEntity))
  })

  describe('sendMessage', () => {
    it('should send a WhatsApp message successfully', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config: Record<string, string> = {
          WHATSAPP_API_URL: 'https://graph.instagram.com/v19.0',
          WHATSAPP_API_TOKEN: 'test-token',
          WHATSAPP_PHONE_ID: 'test-phone-id',
        }
        return config[key]
      })

      ;(axios.post as jest.Mock).mockResolvedValue({ status: 200 })

      const result = await service.sendMessage('+2349123456789', 'Test message')

      expect(result).toBe(true)
      expect(axios.post).toHaveBeenCalledWith(
        'https://graph.instagram.com/v19.0/test-phone-id/messages',
        {
          messaging_product: 'whatsapp',
          to: '2349123456789',
          type: 'text',
          text: { body: 'Test message' },
        },
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
          }),
        }),
      )
    })

    it('should return false if API is not configured', async () => {
      mockConfigService.get.mockReturnValue(undefined)

      const result = await service.sendMessage('+2349123456789', 'Test message')

      expect(result).toBe(false)
      expect(axios.post).not.toHaveBeenCalled()
    })

    it('should return false for invalid phone number', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config: Record<string, string> = {
          WHATSAPP_API_URL: 'https://graph.instagram.com/v19.0',
          WHATSAPP_API_TOKEN: 'test-token',
          WHATSAPP_PHONE_ID: 'test-phone-id',
        }
        return config[key]
      })

      const result = await service.sendMessage('', 'Test message')

      expect(result).toBe(false)
      expect(axios.post).not.toHaveBeenCalled()
    })

    it('should normalize phone number (remove leading +)', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config: Record<string, string> = {
          WHATSAPP_API_URL: 'https://graph.instagram.com/v19.0',
          WHATSAPP_API_TOKEN: 'test-token',
          WHATSAPP_PHONE_ID: 'test-phone-id',
        }
        return config[key]
      })

      ;(axios.post as jest.Mock).mockResolvedValue({ status: 200 })

      await service.sendMessage('+2349123456789', 'Test')

      const callArgs = (axios.post as jest.Mock).mock.calls[0]
      expect(callArgs[1].to).toBe('2349123456789')
    })

    it('should log reminder to database on success', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config: Record<string, string> = {
          WHATSAPP_API_URL: 'https://graph.instagram.com/v19.0',
          WHATSAPP_API_TOKEN: 'test-token',
          WHATSAPP_PHONE_ID: 'test-phone-id',
        }
        return config[key]
      })

      ;(axios.post as jest.Mock).mockResolvedValue({ status: 200 })

      await service.sendMessage('+2349123456789', 'Test message', 'user-123', 'payment_reminder')

      expect(reminderRepo.create).toHaveBeenCalledWith({
        memberId: 'user-123',
        channel: 'payment_reminder',
      })
      expect(reminderRepo.save).toHaveBeenCalled()
    })

    it('should handle API errors gracefully', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config: Record<string, string> = {
          WHATSAPP_API_URL: 'https://graph.instagram.com/v19.0',
          WHATSAPP_API_TOKEN: 'test-token',
          WHATSAPP_PHONE_ID: 'test-phone-id',
        }
        return config[key]
      })

      ;(axios.post as jest.Mock).mockRejectedValue(
        new Error('API Error'),
      )

      const result = await service.sendMessage('+2349123456789', 'Test message')

      expect(result).toBe(false)
    })
  })

  describe('normalizePhone', () => {
    it('should remove leading + from phone number', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config: Record<string, string> = {
          WHATSAPP_API_URL: 'https://graph.instagram.com/v19.0',
          WHATSAPP_API_TOKEN: 'test-token',
          WHATSAPP_PHONE_ID: 'test-phone-id',
        }
        return config[key]
      })

      ;(axios.post as jest.Mock).mockResolvedValue({ status: 200 })

      await service.sendMessage('+234 912 3456 789', 'Test')

      const callArgs = (axios.post as jest.Mock).mock.calls[0]
      expect(callArgs[1].to).toBe('2349123456789')
    })
  })

  describe('hasRecentReminder', () => {
    it('should return true if reminder was sent in last 24 hours', async () => {
      reminderRepo.createQueryBuilder.mockReturnValueOnce({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
      })

      const result = await service.hasRecentReminder('2349123456789')

      expect(result).toBe(true)
      expect(reminderRepo.createQueryBuilder).toHaveBeenCalledWith('r')
    })
  })
})
