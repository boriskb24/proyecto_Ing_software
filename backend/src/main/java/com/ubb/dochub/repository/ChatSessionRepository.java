package com.ubb.dochub.repository;
    
import com.ubb.dochub.entity.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
    
import java.util.List;
import java.util.Optional;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {

    Optional<ChatSession> findFirstByPlanificacionIdAndUserEmailOrderByCreatedAtDesc(Long planificacionId, String userEmail);

    List<ChatSession> findByPlanificacionIdOrderByCreatedAtDesc(Long planificacionId);

    List<ChatSession> findByUserEmailOrderByCreatedAtDesc(String userEmail);

    Optional<ChatSession> findByIdAndUserEmail(Long id, String userEmail);
}
