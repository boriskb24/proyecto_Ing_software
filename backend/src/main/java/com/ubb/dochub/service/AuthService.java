package com.ubb.dochub.service;

import com.ubb.dochub.dto.AuthResponse;
import com.ubb.dochub.dto.LoginRequest;
import com.ubb.dochub.dto.RegisterRequest;
import com.ubb.dochub.dto.UserDto;

public interface AuthService {
    UserDto register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    UserDto getCurrentUser(String email);
}
