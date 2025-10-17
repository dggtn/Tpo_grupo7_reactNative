import { createSlice } from '@reduxjs/toolkit';
import { login } from './authSlice';

const userSlice = createSlice({
  name: 'user',
  initialState: {
    id: null,
    email: null,
    username: null,
    firstName: null,
    lastName: null,
    role: null,
    age: null,
    address: null,
    urlAvatar: null,
  },
  reducers: {
    setUser: (state, action) => {
      return { ...state, ...action.payload };
    },
    updateUser: (state, action) => {
      return { ...state, ...action.payload };
    },
    clearUser: (state) => {
      return {
        id: null,
        email: null,
        username: null,
        firstName: null,
        lastName: null,
        role: null,
        age: null,
        address: null,
        urlAvatar: null,
      };
    },
    setUserEmail: (state, action) => {
      state.email = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(login.fulfilled, (state, action) => {
      // Cuando se hace login exitoso, guardar email
      if (action.meta.arg.email) {
        state.email = action.meta.arg.email;
      }
    });
  },
});

export const { setUser, updateUser, clearUser, setUserEmail } = userSlice.actions;

// Selectors
export const selectUser = (state) => state.user;
export const selectUserEmail = (state) => state.user.email;
export const selectUserFullName = (state) => {
  const { firstName, lastName, username } = state.user;
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  return username || 'Usuario';
};
export const selectUserId = (state) => state.user.id;

export default userSlice.reducer;