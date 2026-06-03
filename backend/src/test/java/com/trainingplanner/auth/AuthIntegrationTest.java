package com.trainingplanner.auth;

import tools.jackson.databind.ObjectMapper;
import com.trainingplanner.auth.dto.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import com.trainingplanner.support.MongoTestContainerConfig;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Import(MongoTestContainerConfig.class)
@TestPropertySource(properties = "app.invite-code=test-invite-code")
class AuthIntegrationTest {

    private static final String INVITE = "test-invite-code";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void cleanUp() {
        userRepository.deleteAll();
    }

    // --- Register ---

    @Test
    void register_validRequest_returns201WithTokens() throws Exception {
        RegisterRequest req = new RegisterRequest("test@example.com", "password123", "Test User", INVITE);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty());
    }

    @Test
    void register_wrongInviteCode_returns403() throws Exception {
        RegisterRequest req = new RegisterRequest("nope@example.com", "password123", "User", "wrong-code");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    void register_missingInviteCode_returns400() throws Exception {
        RegisterRequest req = new RegisterRequest("blank@example.com", "password123", "User", "");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_duplicateEmail_returns409() throws Exception {
        RegisterRequest req = new RegisterRequest("dup@example.com", "password123", "User", INVITE);
        String json = objectMapper.writeValueAsString(req);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isConflict());
    }

    @Test
    void register_shortPassword_returns400() throws Exception {
        RegisterRequest req = new RegisterRequest("x@example.com", "short", "User", INVITE);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    // --- Login ---

    @Test
    void login_validCredentials_returns200WithTokens() throws Exception {
        // First register
        registerUser("login@example.com", "password123", "Login User");

        LoginRequest req = new LoginRequest("login@example.com", "password123");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty());
    }

    @Test
    void login_wrongPassword_returns401() throws Exception {
        registerUser("wrong@example.com", "password123", "User");

        LoginRequest req = new LoginRequest("wrong@example.com", "wrongpassword");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    // --- Protected endpoint ---

    @Test
    void getMe_withValidToken_returns200() throws Exception {
        String accessToken = registerAndGetAccessToken("me@example.com", "password123", "Me User");

        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("me@example.com"))
                .andExpect(jsonPath("$.displayName").value("Me User"));
    }

    @Test
    void getMe_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getMe_withInvalidToken_returns401() throws Exception {
        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer invalid.token.here"))
                .andExpect(status().isUnauthorized());
    }

    // --- Token refresh ---

    @Test
    void refresh_validRefreshToken_returns200WithNewTokens() throws Exception {
        TokenResponse tokens = registerUser("refresh@example.com", "password123", "Refresh User");

        RefreshRequest req = new RefreshRequest(tokens.refreshToken());
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty());
    }

    @Test
    void refresh_invalidToken_returns401() throws Exception {
        RefreshRequest req = new RefreshRequest("invalid-refresh-token");
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    // --- User isolation ---

    @Test
    void userA_cannotUseUserBToken() throws Exception {
        // Register two users and verify their tokens are distinct and non-interchangeable
        String tokenA = registerAndGetAccessToken("a@example.com", "password123", "User A");
        String tokenB = registerAndGetAccessToken("b@example.com", "password123", "User B");

        // Token A should return user A's data
        MvcResult resultA = mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andReturn();

        // Token B should return user B's data
        MvcResult resultB = mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andReturn();

        UserResponse userA = objectMapper.readValue(resultA.getResponse().getContentAsString(), UserResponse.class);
        UserResponse userB = objectMapper.readValue(resultB.getResponse().getContentAsString(), UserResponse.class);

        assertThat(userA.email()).isEqualTo("a@example.com");
        assertThat(userB.email()).isEqualTo("b@example.com");
        assertThat(userA.id()).isNotEqualTo(userB.id());
    }

    // --- Settings update ---

    @Test
    void updateMe_changesDisplayNameAndFormula() throws Exception {
        String token = registerAndGetAccessToken("settings@example.com", "password123", "Old Name");

        UpdateProfileRequest req = new UpdateProfileRequest("New Name",
                com.trainingplanner.domain.OneRmFormula.BRZYCKI);

        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("New Name"))
                .andExpect(jsonPath("$.preferredOneRmFormula").value("BRZYCKI"));
    }

    // --- Helpers ---

    private TokenResponse registerUser(String email, String password, String displayName) throws Exception {
        RegisterRequest req = new RegisterRequest(email, password, displayName, INVITE);
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readValue(result.getResponse().getContentAsString(), TokenResponse.class);
    }

    private String registerAndGetAccessToken(String email, String password, String displayName) throws Exception {
        return registerUser(email, password, displayName).accessToken();
    }
}
