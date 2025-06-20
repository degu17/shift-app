import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { formatDateToString } from './utils/date-utils';
import { db } from './firebase';
import type { Staff, WeeklyShift, ShiftAssignment } from './types';

/**
 * スタッフ関連のFirestore操作
 */
export class StaffService {
  private static COLLECTION_NAME = 'staff';

  /**
   * 全スタッフを取得
   */
  static async getAllStaff(): Promise<Staff[]> {
    try {
      const staffCollection = collection(db, this.COLLECTION_NAME);
      const staffSnapshot = await getDocs(query(staffCollection, orderBy('name')));
      
      return staffSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Staff));
    } catch (error) {
      console.error('スタッフ一覧取得エラー:', error);
      throw error;
    }
  }

  /**
   * アクティブなスタッフのみを取得
   */
  static async getActiveStaff(): Promise<Staff[]> {
    try {
      const staffCollection = collection(db, this.COLLECTION_NAME);
      const staffSnapshot = await getDocs(
        query(
          staffCollection, 
          where('isActive', '==', true),
          orderBy('name')
        )
      );
      
      return staffSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Staff));
    } catch (error) {
      console.error('アクティブスタッフ取得エラー:', error);
      throw error;
    }
  }

  /**
   * スタッフIDでスタッフを取得
   */
  static async getStaffById(id: string): Promise<Staff | null> {
    try {
      const staffDoc = await getDoc(doc(db, this.COLLECTION_NAME, id));
      
      if (staffDoc.exists()) {
        return {
          id: staffDoc.id,
          ...staffDoc.data()
        } as Staff;
      }
      
      return null;
    } catch (error) {
      console.error('スタッフ取得エラー:', error);
      throw error;
    }
  }

  /**
   * 新しいスタッフを追加
   */
  static async createStaff(staffData: Omit<Staff, 'id'>): Promise<string> {
    try {
      const staffCollection = collection(db, this.COLLECTION_NAME);
      const docRef = await addDoc(staffCollection, staffData);
      
      return docRef.id;
    } catch (error) {
      console.error('スタッフ作成エラー:', error);
      throw error;
    }
  }

  /**
   * スタッフ情報を更新
   */
  static async updateStaff(id: string, staffData: Partial<Omit<Staff, 'id'>>): Promise<void> {
    try {
      const staffDoc = doc(db, this.COLLECTION_NAME, id);
      await updateDoc(staffDoc, staffData);
    } catch (error) {
      console.error('スタッフ更新エラー:', error);
      throw error;
    }
  }

  /**
   * スタッフを削除（論理削除：isActiveをfalseに設定）
   */
  static async deactivateStaff(id: string): Promise<void> {
    try {
      await this.updateStaff(id, { isActive: false });
    } catch (error) {
      console.error('スタッフ無効化エラー:', error);
      throw error;
    }
  }

  /**
   * スタッフを物理削除
   */
  static async deleteStaff(id: string): Promise<void> {
    try {
      const staffDoc = doc(db, this.COLLECTION_NAME, id);
      await deleteDoc(staffDoc);
    } catch (error) {
      console.error('スタッフ削除エラー:', error);
      throw error;
    }
  }
}

/**
 * シフト関連のFirestore操作
 */
export class ShiftService {
  private static COLLECTION_NAME = 'shifts';

  /**
   * 指定した週のシフトを取得
   */
  static async getShiftByWeek(weekStartDate: string): Promise<WeeklyShift | null> {
    try {
      const shiftsCollection = collection(db, this.COLLECTION_NAME);
      const shiftSnapshot = await getDocs(
        query(
          shiftsCollection,
          where('weekStartDate', '==', weekStartDate)
        )
      );
      
      if (shiftSnapshot.empty) {
        return null;
      }
      
      const doc = shiftSnapshot.docs[0];
      const data = doc.data();
      
      // デフォルト値を設定してデータの整合性を保証
      return {
        id: doc.id,
        weekStartDate: data.weekStartDate || '',
        status: data.status || 'confirmed',
        assignments: data.assignments || [],
        optimizationHistory: data.optimizationHistory || [],
        createdBy: data.createdBy || 'unknown',
        createdAt: data.createdAt?.toDate() || new Date(),
        lastModified: data.lastModified?.toDate() || new Date()
      } as WeeklyShift;
    } catch (error) {
      console.error('週次シフト取得エラー:', error);
      throw error;
    }
  }

  /**
   * 指定した期間のシフトを取得
   */
  static async getShiftsByDateRange(startDate: string, endDate: string): Promise<WeeklyShift[]> {
    try {
      console.log(`=== Firestore クエリ実行 ===`);
      console.log(`検索条件: weekStartDate >= '${startDate}' AND weekStartDate <= '${endDate}'`);
      
      const shiftsCollection = collection(db, this.COLLECTION_NAME);
      const shiftSnapshot = await getDocs(
        query(
          shiftsCollection,
          where('weekStartDate', '>=', startDate),
          where('weekStartDate', '<=', endDate),
          orderBy('weekStartDate')
        )
      );
      
      console.log(`Firestoreから取得したドキュメント数: ${shiftSnapshot.docs.length}`);
      
      const results = shiftSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log(`ドキュメント ${doc.id}:`, {
          weekStartDate: data.weekStartDate,
          status: data.status,
          assignmentsCount: data.assignments?.length || 0
        });
        
        return {
          id: doc.id,
          weekStartDate: data.weekStartDate || '',
          status: data.status || 'confirmed',
          assignments: data.assignments || [],
          optimizationHistory: data.optimizationHistory || [],
          createdBy: data.createdBy || 'unknown',
          createdAt: data.createdAt?.toDate() || new Date(),
          lastModified: data.lastModified?.toDate() || new Date()
        } as WeeklyShift;
      });
      
      console.log(`=== Firestore クエリ完了 ===`);
      return results;
    } catch (error) {
      console.error('期間シフト取得エラー:', error);
      throw error;
    }
  }

  /**
   * 全シフトを取得（管理用）
   */
  static async getAllShifts(): Promise<WeeklyShift[]> {
    try {
      const shiftsCollection = collection(db, this.COLLECTION_NAME);
      const shiftSnapshot = await getDocs(
        query(shiftsCollection, orderBy('weekStartDate', 'desc'))
      );
      
      return shiftSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          weekStartDate: data.weekStartDate || '',
          status: data.status || 'confirmed',
          assignments: data.assignments || [],
          optimizationHistory: data.optimizationHistory || [],
          createdBy: data.createdBy || 'unknown',
          createdAt: data.createdAt?.toDate() || new Date(),
          lastModified: data.lastModified?.toDate() || new Date()
        } as WeeklyShift;
      });
    } catch (error) {
      console.error('全シフト取得エラー:', error);
      throw error;
    }
  }

  /**
   * 新しいシフトを作成
   */
  static async createShift(shiftData: Omit<WeeklyShift, 'id' | 'createdAt' | 'lastModified'>): Promise<string> {
    try {
      const shiftsCollection = collection(db, this.COLLECTION_NAME);
      const now = Timestamp.now();
      
      const docRef = await addDoc(shiftsCollection, {
        ...shiftData,
        createdAt: now,
        lastModified: now
      });
      
      return docRef.id;
    } catch (error) {
      console.error('シフト作成エラー:', error);
      throw error;
    }
  }

  /**
   * シフトを更新
   */
  static async updateShift(id: string, shiftData: Partial<Omit<WeeklyShift, 'id' | 'createdAt'>>): Promise<void> {
    try {
      const shiftDoc = doc(db, this.COLLECTION_NAME, id);
      await updateDoc(shiftDoc, {
        ...shiftData,
        lastModified: Timestamp.now()
      });
    } catch (error) {
      console.error('シフト更新エラー:', error);
      throw error;
    }
  }

  /**
   * シフトの配属情報を更新
   */
  static async updateShiftAssignments(id: string, assignments: ShiftAssignment[]): Promise<void> {
    try {
      await this.updateShift(id, { assignments });
    } catch (error) {
      console.error('シフト配属更新エラー:', error);
      throw error;
    }
  }

  /**
   * シフトのステータスを更新
   */
  static async updateShiftStatus(id: string, status: 'optimizing' | 'confirmed'): Promise<void> {
    try {
      await this.updateShift(id, { status });
    } catch (error) {
      console.error('シフトステータス更新エラー:', error);
      throw error;
    }
  }

  /**
   * シフトを削除
   */
  static async deleteShift(id: string): Promise<void> {
    try {
      const shiftDoc = doc(db, this.COLLECTION_NAME, id);
      await deleteDoc(shiftDoc);
    } catch (error) {
      console.error('シフト削除エラー:', error);
      throw error;
    }
  }

  /**
   * 空のシフトテンプレートを作成
   */
  static createEmptyShift(weekStartDate: string, createdBy: string = 'anonymous'): Omit<WeeklyShift, 'id' | 'createdAt' | 'lastModified'> {
    // 1週間分の空の配属を生成
    const assignments: ShiftAssignment[] = [];
    const weekStart = new Date(weekStartDate);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateString = formatDateToString(date);
      
      assignments.push({
        date: dateString,
        shifts: {
          day: [],
          evening: [],
          night: []
        }
      });
    }
    
    return {
      weekStartDate,
      status: 'confirmed',
      assignments,
      optimizationHistory: [],
      createdBy
    };
  }
} 