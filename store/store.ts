import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import minimizeReducer from './minimizeSlice';
import userInfoReducer from './usersInfo';
import minimizeUsersInfoReducer from './minimizeUsersInfoSlice';
import currentUserReducer from './currentUser';
const store = configureStore({
  reducer: {
    user: userReducer,
    userInfo: userInfoReducer,
    currentUser: currentUserReducer,
    minimize: minimizeReducer,
    minimizeUsersInfo: minimizeUsersInfoReducer,
  },
});
export type RootState = ReturnType<typeof store.getState>;

export default store;
