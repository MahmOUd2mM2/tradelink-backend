import prisma from '../prisma';

export interface LogEntry {
  entity_type: string;
  entity_id: number;
  action: string;
  previous_state?: string;
  new_state: string;
}

export class LogService {
  /**
   * Records a high-integrity immutable log for critical operations
   */
  static async log(entry: LogEntry) {
    const signature = `SIG-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    
    return await prisma.immutableLog.create({
      data: {
        entity_type: entry.entity_type,
        entity_id: entry.entity_id,
        action: entry.action,
        previous_state: entry.previous_state || null,
        new_state: entry.new_state,
        signature: signature
      }
    });
  }

  /**
   * Fetches full history for a specific entity
   */
  static async getHistory(entityType: string, entityId: number) {
    return await prisma.immutableLog.findMany({
      where: { entity_type: entityType, entity_id: entityId },
      orderBy: { created_at: 'desc' }
    });
  }
}
