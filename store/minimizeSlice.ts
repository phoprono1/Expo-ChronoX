import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface MinimizeState {
  isMinimized: boolean;
}

const initialState: MinimizeState = {
  isMinimized: false,
};

const minimizeSlice = createSlice({
  name: 'minimize',
  initialState,
  reducers: {
    setMinimized(state: MinimizeState, action: PayloadAction<boolean>) {
      state.isMinimized = action.payload;
    },
  },
});

export const { setMinimized } = minimizeSlice.actions;
export default minimizeSlice.reducer;