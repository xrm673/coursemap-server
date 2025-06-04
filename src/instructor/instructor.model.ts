export interface Instructor {
    _id: string;
    netid: string;
    lNm: string; // last name
    fNm: string; // first name
    mNm: string; // middle name
    rmpId?: string; // RateMyProfessor ID
    rmpScore?: number; // RateMyProfessor score
}