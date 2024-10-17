import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "./store";

interface UserInfoState {
  $id: string;
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

const initialState: UserInfoState = {
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

const userInfoSlice = createSlice({
  name: 'userInfo',
  initialState,
  reducers: {
    setUserInfo(state: UserInfoState, action: PayloadAction<UserInfoState>) {
      return { ...state, ...action.payload };
    },
    clearUserInfo(state: UserInfoState) {
      return initialState;
    },
  },
});
export const getUserInfo = (state: RootState): UserInfoState => state.userInfo;

export const { setUserInfo, clearUserInfo } = userInfoSlice.actions;
export default userInfoSlice.reducer;