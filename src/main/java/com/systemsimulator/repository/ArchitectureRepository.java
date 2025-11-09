package com.systemsimulator.repository;

import com.systemsimulator.model.Architecture;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ArchitectureRepository extends MongoRepository<Architecture, String> {

    List<Architecture> findByUserId(String userId);

    List<Architecture> findByQuestionId(String questionId);

    List<Architecture> findByUserIdAndQuestionId(String userId, String questionId);

    List<Architecture> findBySubmittedTrue();
}

