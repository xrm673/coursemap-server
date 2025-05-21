import { db } from '../../db/firebase-admin';

export interface College {
    id: string;
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
        id: doc.id, 
        ...doc.data() 
    } as College));
};

/*
    Find a college by its id
*/
export const findById = async (id: string): Promise<College | null> => {
    const doc = await collegesCollection.doc(id).get();
    if (!doc.exists) return null;
    return { 
        id: doc.id, 
        ...doc.data() 
    } as College;
};

/*
    Search colleges by major name
*/
export const searchByMajor = async (query: string): Promise<College[]> => {
    const snapshot = await collegesCollection.get();
    const colleges = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
    } as College));

    return colleges
        .map(college => ({
            ...college,
            majors: college.majors.filter(major => 
                major.name.toLowerCase().includes(query.toLowerCase())
            )
        }))
        .filter(college => college.majors.length > 0);
};