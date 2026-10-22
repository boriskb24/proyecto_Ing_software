package com.ubb.dochub;

import com.ubb.dochub.config.DotenvEnvironmentPostProcessor;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DochubApplication {

    public static void main(String[] args) {
        DotenvEnvironmentPostProcessor.loadDotenv();
        SpringApplication.run(DochubApplication.class, args);
    }
}
