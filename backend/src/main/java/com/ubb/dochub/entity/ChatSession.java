package com.ubb.dochub.entity;
    
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
    
@Entity
@Table(name = "chat_session")
public class ChatSession {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // Vinculación con la planificación que se está evaluando
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_planificacion", nullable = true)
    private Planificacion planificacion;
    
    @Column(name = "user_email", nullable = false)
    private String userEmail;
    
    @Column(name = "rol_usuario", nullable = false)
    private String rolUsuario; // "ESTUDIANTE" o "PROFESOR"
    
    @Column(name = "total_paginas")
    private Integer totalPaginas;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("createdAt ASC")
    private List<ChatMessage> messages = new ArrayList<>();
    
    public ChatSession() {}
    
    public ChatSession(Planificacion planificacion, String userEmail, String rolUsuario, Integer totalPaginas) {
        this.planificacion = planificacion;
        this.userEmail = userEmail;
        this.rolUsuario = rolUsuario;
        this.totalPaginas = totalPaginas;
    }
    
    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        if (this.updatedAt == null) {
            this.updatedAt = now;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    public void addMessage(ChatMessage message) {
        messages.add(message);
        message.setSession(this);
    }
    
    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Planificacion getPlanificacion() { return planificacion; }
    public void setPlanificacion(Planificacion planificacion) { this.planificacion = planificacion; }
    
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
    
    public String getRolUsuario() { return rolUsuario; }
    public void setRolUsuario(String rolUsuario) { this.rolUsuario = rolUsuario; }
    
    public Integer getTotalPaginas() { return totalPaginas; }
    public void setTotalPaginas(Integer totalPaginas) { this.totalPaginas = totalPaginas; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public List<ChatMessage> getMessages() { return messages; }
    public void setMessages(List<ChatMessage> messages) { this.messages = messages; }
}
