pipeline {
    agent any
    tools {
        nodejs 'NodeJS'
    }

    environment {
        NEXUS_URL = 'http://192.168.33.10:8081'
        NEXUS_REPO = 'maven-releases'
        BUILD_VERSION = "${env.BUILD_ID}-${new Date().format('yyyyMMddHHmm')}"
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', 
                    credentialsId: 'github-token', 
                    url: 'https://github.com/Saif-Hlaimi/DevMinds_4TWIN5_pidev.git'
            }
        }

       stage('Verify Tools') {
            steps {
                script {
                    // Check if zip is available, continue with warning if not
                    def zipAvailable = sh(script: 'command -v zip || true', returnStatus: true) == 0
                    if (!zipAvailable) {
                        echo "WARNING: zip command not found. Frontend artifacts won't be zipped."
                        // You could also fail the pipeline here if zip is required:
                        // error "zip command is required but not found"
                    }
                    env.ZIP_AVAILABLE = zipAvailable
                }
            }
        }

        stage('Check GitHub Actions') {
            steps {
                script {
                    withCredentials([string(credentialsId: 'github-token', variable: 'GITHUB_TOKEN')]) {
                        def response = sh(script: """
                            curl -s -H "Authorization: token \${GITHUB_TOKEN}" \\
                                -H "Accept: application/vnd.github.v3+json" \\
                                https://api.github.com/repos/Saif-Hlaimi/DevMinds_4TWIN5_pidev/actions/workflows/ci.yml/runs?per_page=1
                        """, returnStdout: true).trim()

                        def json = readJSON text: response
                        def run = json.workflow_runs[0] ?: error('No GitHub Actions runs found')

                        echo """
                        GitHub Actions Run:
                        - ID: ${run.id}
                        - Status: ${run.status}
                        - Conclusion: ${run.conclusion}
                        - URL: ${run.html_url}
                        """

                        def jobs = sh(script: """
                            curl -s -H "Authorization: token \${GITHUB_TOKEN}" \\
                                -H "Accept: application/vnd.github.v3+json" \\
                                https://api.github.com/repos/Saif-Hlaimi/DevMinds_4TWIN5_pidev/actions/runs/${run.id}/jobs
                        """, returnStdout: true).trim()

                        def frontendJob = readJSON(text: jobs).jobs.find { it.name == 'frontend' }
                        def backendJob = readJSON(text: jobs).jobs.find { it.name == 'backend' }

                        if (frontendJob?.conclusion != 'success' || backendJob?.conclusion != 'success') {
                            error "Tests failed: Frontend=${frontendJob?.conclusion}, Backend=${backendJob?.conclusion}"
                        }
                    }
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool 'sonar-scanner'
                    withSonarQubeEnv('sq1') {
                        sh """
                            \${scannerHome}/bin/sonar-scanner \\
                            -Dsonar.projectKey=DevMinds_4TWIN5_pidev \\
                            -Dsonar.projectName=DevMinds_4TWIN5_pidev \\
                            -Dsonar.sources=Backend/Controllers \\
                            -Dsonar.tests=Backend/tests,Backend/test 
                        """
                    }
                }
            }
        }

     

        stage('Publish to Nexus') {
            steps {
                script {
                    withCredentials([usernamePassword(
                        credentialsId: 'nexus-credentials',
                        usernameVariable: 'NEXUS_USER',
                        passwordVariable: 'NEXUS_PASS'
                    )]) {
                        sh """
                            if [ -d "frontendReact/dist" ]; then
                                zip -r frontend-\${BUILD_VERSION}.zip frontendReact/dist/ || echo "Warning: Frontend zip failed"
                                curl -f -u \$NEXUS_USER:\$NEXUS_PASS \\
                                    --upload-file frontend-\${BUILD_VERSION}.zip \\
                                    "\$NEXUS_URL/repository/\$NEXUS_REPO/frontend/\${BUILD_VERSION}/" || echo "Warning: Frontend upload failed"
                            else
                                echo "Warning: frontendReact/dist directory not found"
                            fi
                        """

                        sh """
                            if [ -d "Backend/target" ] && [ -n "\$(ls -A Backend/target/*.jar 2>/dev/null)" ]; then
                                curl -f -u \$NEXUS_USER:\$NEXUS_PASS \\
                                    --upload-file Backend/target/*.jar \\
                                    "\$NEXUS_URL/repository/\$NEXUS_REPO/backend/\${BUILD_VERSION}/" || echo "Warning: Backend upload failed"
                            else
                                echo "Warning: No JAR files found in Backend/target"
                            fi
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: '**/dist/**,**/target/*.jar', allowEmptyArchive: true
            cleanWs()
        }
        success {
            echo "Pipeline succeeded! Artifacts published to Nexus:"
            echo "Frontend: ${NEXUS_URL}/repository/${NEXUS_REPO}/frontend/${BUILD_VERSION}/"
            echo "Backend: ${NEXUS_URL}/repository/${NEXUS_REPO}/backend/${BUILD_VERSION}/"
        }
        failure {
            echo 'Pipeline failed! Check logs for details.'
        }
    }
}