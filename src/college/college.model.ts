import { db } from '../../db/firebase-admin';

export interface College {
    code: string;
    name: string;
    majors: Array<{
        id: string;
        name: string;
    }>;
}

const collegesCollection = db.collection('colleges');

/*
    Find all colleges
*/
export const find = async (): Promise<College[]> => {
    const snapshot = await collegesCollection.get();
    return snapshot.docs.map(doc => ({ 
        code: doc.id, 
        ...doc.data() 
    } as College));
};

/*
    Find a college by its code
*/
export const findByCode = async (code: string): Promise<College | null> => {
    const doc = await collegesCollection.doc(code).get();
    if (!doc.exists) return null;
    return { 
        code: doc.id, 
        ...doc.data() 
    } as College;
};