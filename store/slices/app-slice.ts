import { createSlice } from "@reduxjs/toolkit";

type AppState = {
  isReady: boolean;
};

const initialState: AppState = {
  isReady: true,
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {},
});

export default appSlice.reducer;
