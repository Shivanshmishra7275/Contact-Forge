import { getDatabase } from '../index';
import { Group, ContactGroup, LocalContact } from '../../types';

export class GroupRepository {
  /**
   * Create a new group. Returns the ID of the created group.
   */
  static createGroup(name: string, color: string): number {
    const db = getDatabase();
    const result = db.runSync(
      `INSERT INTO groups (name, color, created_at) VALUES (?, ?, ?)`,
      [name.trim(), color, new Date().toISOString()]
    );
    return result.lastInsertRowId;
  }

  /**
   * Update an existing group.
   */
  static updateGroup(id: number, name: string, color: string): void {
    const db = getDatabase();
    db.runSync(
      `UPDATE groups SET name = ?, color = ? WHERE id = ?`,
      [name.trim(), color, id]
    );
  }

  /**
   * Delete a group by ID.
   */
  static deleteGroup(id: number): void {
    const db = getDatabase();
    db.runSync(`DELETE FROM groups WHERE id = ?`, [id]);
  }

  /**
   * Get all groups, optionally ordered by name.
   */
  static getAllGroups(): Group[] {
    const db = getDatabase();
    return db.getAllSync<Group>(`
      SELECT id, name, color, created_at as createdAt 
      FROM groups 
      ORDER BY name ASC
    `);
  }

  /**
   * Assign a contact to a group. Returns the ID of the mapping.
   */
  static assignContactToGroup(contactId: number, groupId: number): number {
    const db = getDatabase();
    // Use INSERT OR IGNORE to gracefully handle re-assignments
    const result = db.runSync(
      `INSERT OR IGNORE INTO contact_groups (contact_id, group_id, assigned_at) 
       VALUES (?, ?, ?)`,
      [contactId, groupId, new Date().toISOString()]
    );
    return result.lastInsertRowId;
  }

  /**
   * Remove a contact from a group.
   */
  static removeContactFromGroup(contactId: number, groupId: number): void {
    const db = getDatabase();
    db.runSync(
      `DELETE FROM contact_groups WHERE contact_id = ? AND group_id = ?`,
      [contactId, groupId]
    );
  }

  /**
   * Get all groups assigned to a specific contact.
   */
  static getGroupsForContact(contactId: number): Group[] {
    const db = getDatabase();
    return db.getAllSync<Group>(`
      SELECT g.id, g.name, g.color, g.created_at as createdAt 
      FROM groups g
      INNER JOIN contact_groups cg ON cg.group_id = g.id
      WHERE cg.contact_id = ?
      ORDER BY g.name ASC
    `, [contactId]);
  }

  /**
   * Get all contacts assigned to a specific group.
   */
  static getContactsForGroup(groupId: number): LocalContact[] {
    const db = getDatabase();
    return db.getAllSync<LocalContact>(`
      SELECT c.id, c.native_id as nativeId, c.first_name as firstName, c.last_name as lastName, 
             c.display_name as displayName, c.normalized_name as normalizedName, 
             c.company, c.job_title as jobTitle, c.notes, c.birthday, c.image_uri as imageUri, 
             c.has_thumbnail as hasThumbnail, c.is_temporary as isTemporary, 
             c.is_ghost as isGhost, c.tags, c.synced_at as syncedAt, 
             c.created_at as createdAt, c.updated_at as updatedAt
      FROM contacts c
      INNER JOIN contact_groups cg ON cg.contact_id = c.id
      WHERE cg.group_id = ?
      ORDER BY c.normalized_name ASC
    `, [groupId]);
  }
}
