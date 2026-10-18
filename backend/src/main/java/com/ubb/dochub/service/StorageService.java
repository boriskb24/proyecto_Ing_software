package com.ubb.dochub.service;

import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

public interface StorageService {

    String storeFile(MultipartFile file, String subDirectory);

    Resource loadFileAsResource(String filePath, String fallbackSamplePath);

    ResponseEntity<Resource> servePdf(String filePath, String fallbackSamplePath, String downloadFilename);
}
