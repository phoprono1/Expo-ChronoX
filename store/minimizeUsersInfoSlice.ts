import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface MinimizeUsersInfoState {
  isMinimized: boolean;
}

const initialState: MinimizeUsersInfoState = {
  isMinimized: false,
};

const minimizeUsersInfoSlice = createSlice({
  name: 'minimizeUsersInfo',
  initialState,
  reducers: {
    setMinimized(state: MinimizeUsersInfoState, action: PayloadAction<boolean>) {
      state.isMinimized = action.payload;
    },
  },
});

export const { setMinimized } = minimizeUsersInfoSlice.actions;
export default minimizeUsersInfoSlice.reducer;