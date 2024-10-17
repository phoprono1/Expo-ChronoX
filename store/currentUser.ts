import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CurrentUserState {
  $id: string
  email: string;
  userId: string;
  avatar: string | null;
  name: string;
  bio: string;
  followed: number;
  follower: number;
  location: string | null;
  website: string | null;
  postsCount: number;
}

const initialState: CurrentUserState = {
  $id: '',
  email: '',
  userId: '',
  avatar: null,
  name: '',
  bio: '',
  followed: 0,
  follower: 0,
  location: null,
  website: null,
  postsCount: 0,
};

const currentUserSlice = createSlice({
  name: 'currentUser',
  initialState,
  reducers: {
    setUser(state: CurrentUserState, action: PayloadAction<CurrentUserState>) {
      return { ...state, ...action.payload };
    },
    clearUser(state: CurrentUserState) {
      return initialState;
    },
  },
});

export const { setUser, clearUser } = currentUserSlice.actions;
export default currentUserSlice.reducer;