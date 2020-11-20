import Database from "../database";
import Inventory from "./storage/inventory";

export default class Storage {
    protected db: Database;

    constructor(db: Database) {
        this.db = db;
    }

    public async selectInventoryAndProject(): Promise<Array<Inventory>> {
        const query = {
            text:
                `SELECT serial_num, container_id, type_name, weight FROM inventory`,
            values: [],
        };

        try {
            const result = await this.db.client.query(query)
            return result.rows.map(i => {
                return new Inventory(i.serial_num, i.container_id, i.type_name, i.weight, undefined);
            });
        } catch (e) {
            throw new Error('Could not perform projection on Inventory');
        }
    }

    /**
     * Returns a list of objects, each with the keys:
     * - typeName
     * - count
     * - volume
     */
    public async inventoryTypesWithSmallerThanAverageVolume(): Promise<Array<Object>> {
        const query = {
            text:
                `SELECT IT.type_name, COUNT(*) as count, (IT.height * IT.width * IT.length) as volume
                 FROM inventory_type IT, inventory I
                 WHERE I.type_name = IT.type_name
                 GROUP BY IT.type_name
                 HAVING (IT.height * IT.width * IT.length) < (
                   SELECT AVG(height * width * length)
                   FROM inventory_type
                 )
                 ORDER BY count DESC, volume ASC;`,
            values: [],
        };

        try {
            const result = await this.db.client.query(query)
            return result.rows.map(row => {
                return { typeName: row.type_name, count: row.count, volume: row.volume };
            });
        } catch (e) {
            throw new Error('Failed to query inventory types with smaller than average volume');
        }
    }
}
