@REM ----------------------------------------------------------------------------
@REM Licensed to the Apache Software Foundation (ASF) under one
@REM or more contributor license agreements.  See the NOTICE file
@REM distributed with this work for additional information
@REM regarding copyright ownership.  The ASF licenses this file
@REM to you under the Apache License, Version 2.0 (the
@REM "License"); you may not use this file except in compliance
@REM with the License.  You may obtain a copy of the License at
@REM
@REM    https://www.apache.org/licenses/LICENSE-2.0
@REM
@REM Unless required by applicable law or agreed to in writing,
@REM software distributed under the License is distributed on an
@REM "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
@REM KIND, either express or implied.  See the License for the
@REM specific language governing permissions and limitations
@REM under the License.
@REM ----------------------------------------------------------------------------

@REM ----------------------------------------------------------------------------
@REM Apache Maven Wrapper startup batch script, version 3.2.0
@REM ----------------------------------------------------------------------------

@if "%DEBUG%" == "" @echo off

set ERROR_CODE=0

@REM To isolate internal variables from possible post scripts, we use another setlocal
@setlocal

@REM Enable "on demand" expansion
setlocal enabledelayedexpansion

@REM Find the project root directory
set "EXEC_DIR=%CD%"
set "WONT_EXIST=WONT_EXIST"
set "PROJECT_ROOT=%CD%"

:findRoot
if exist "%PROJECT_ROOT%\.mvn" goto foundRoot
set "PROJECT_ROOT_PARENT=%PROJECT_ROOT%\.."
pushd "%PROJECT_ROOT_PARENT%"
set "PROJECT_ROOT_CHECK=%CD%"
popd
if "%PROJECT_ROOT%" == "%PROJECT_ROOT_CHECK%" goto failedToFindRoot
set "PROJECT_ROOT=%PROJECT_ROOT_CHECK%"
goto findRoot

:failedToFindRoot
set "PROJECT_ROOT=%EXEC_DIR%"

:foundRoot

set "WRAPPER_JAR=%PROJECT_ROOT%\.mvn\wrapper\maven-wrapper.jar"
set "WRAPPER_PROPERTIES=%PROJECT_ROOT%\.mvn\wrapper\maven-wrapper.properties"

if exist "%WRAPPER_JAR%" goto run

mkdir "%PROJECT_ROOT%\.mvn\wrapper" 2>NUL

set "DOWNLOAD_URL=https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar"

echo Downloading %DOWNLOAD_URL%
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('%DOWNLOAD_URL%', '%WRAPPER_JAR%')"

:run
if not exist "%WRAPPER_JAR%" (
    echo Error: Could not find or download Maven Wrapper jar.
    exit /b 1
)

set JAVA_EXE=java.exe
if not "%JAVA_HOME%" == "" (
    set "JAVA_EXE=%JAVA_HOME%\bin\java.exe"
)

"%JAVA_EXE%" -cp "%WRAPPER_JAR%" "-Dmaven.multiModuleProjectDirectory=%PROJECT_ROOT%" org.apache.maven.wrapper.MavenWrapperMain %*
set ERROR_CODE=%ERROR_LEVEL%

exit /b %ERROR_CODE%
