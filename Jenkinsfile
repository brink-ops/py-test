pipeline {
    agent any

    environment {
        PYTHON_VERSION = 'python3'
        VIRTUAL_ENV_NAME = 'venv_deploy'
        APP_DEPLOY_DIR = '/opt/py-test-app'
        FLASK_APP_FILE = 'app.py'
        FLASK_PORT = '5000'

        // Docker Hub variables (use Jenkins credentials for security)
        DOCKER_HUB_ORG = 'brinkops'
        DOCKER_HUB_FRONT_REPO = "${DOCKER_HUB_ORG}/py-test-front"
        DOCKER_HUB_BACK_REPO = "${DOCKER_HUB_ORG}/py-test-back"

        // AWS ECR/EKS related variables
        AWS_REGION = 'us-east-2' // User specified region
        EKS_CLUSTER_NAME = 'jb-cluster' // User specified cluster name
    }

    stages {
        stage('Checkout Source Code') {
            steps {
                echo "Cloning repository https://github.com/brink-ops/py-test.git"
                git branch: 'main', url: 'https://github.com/brink-ops/py-test.git'
                sh 'pwd'
                sh 'ls -R'
            }
        }

        stage('Create Dockerfiles') {
            steps {
                script {
                    echo "Creating Dockerfiles for front end and back end..."

                    // Create Frontend Dockerfile
                    writeFile file: 'frontend/Dockerfile', text: """
                        FROM nginx:latest
                        WORKDIR /usr/share/nginx/html
                        COPY index.html .
                        COPY script.js .
                        COPY style.css .
                        COPY nginx.conf /etc/nginx/nginx.conf
                        EXPOSE 80
                        # --- CRITICAL FIX: Change CMD to explicitly use sh -c ---
                        CMD ["/bin/sh", "-c", "nginx -g 'daemon off;'"]
                        # --------------------------------------------------------
                    """

                    // Create Backend Dockerfile
                    writeFile file: 'backend/Dockerfile', text: """
                        FROM python:3.9-slim-buster
                        WORKDIR /app/backend
                        COPY requirements.txt .
                        RUN pip install -r requirements.txt
                        COPY app.py .
                        EXPOSE 5000
                        CMD ["python", "app.py"]
                    """
                    sh 'echo "--- Backend Dockerfile Content ---"; cat backend/Dockerfile; echo "----------------------------------"'

                }
            }
        }

        stage('Build and Push Docker Images') {
            steps {
                script {
                    echo "Logging into Docker Hub..."
                    withCredentials([usernamePassword(credentialsId: '3b870038-ac5f-44b4-87b9-d69023b0de8c', passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                        sh "echo \$DOCKER_PASSWORD | docker login -u \$DOCKER_USERNAME --password-stdin"
                    }

                    // Build and push Frontend Docker image (already corrected)
                    echo "Building and pushing frontend image: ${DOCKER_HUB_FRONT_REPO}:${env.BUILD_NUMBER}"
                    sh "docker build -t ${DOCKER_HUB_FRONT_REPO}:${env.BUILD_NUMBER} frontend"
                    sh "docker push ${DOCKER_HUB_FRONT_REPO}:${env.BUILD_NUMBER}"

                    // Tag and push 'latest' for convenience (already corrected)
                    sh "docker tag ${DOCKER_HUB_FRONT_REPO}:${env.BUILD_NUMBER} ${DOCKER_HUB_FRONT_REPO}:latest"
                    sh "docker push ${DOCKER_HUB_FRONT_REPO}:latest"

                    // Build and push Backend Docker image
                    echo "Building and pushing backend image: ${DOCKER_HUB_BACK_REPO}:${env.BUILD_NUMBER}"
                    // FIX: Remove the '\' before '${env.BUILD_NUMBER}' here
                    sh "docker build -t ${DOCKER_HUB_BACK_REPO}:${env.BUILD_NUMBER} backend"
                    // FIX: Remove the '\' before '${env.BUILD_NUMBER}' here
                    sh "docker push ${DOCKER_HUB_BACK_REPO}:${env.BUILD_NUMBER}"

                    // Tag and push 'latest' for convenience
                    // FIX: Remove the '\' before '${env.BUILD_NUMBER}' here
                    sh "docker tag ${DOCKER_HUB_BACK_REPO}:${env.BUILD_NUMBER} ${DOCKER_HUB_BACK_REPO}:latest"
                    sh "docker push ${DOCKER_HUB_BACK_REPO}:latest"

                    echo "Docker images pushed successfully!"
                }
            }
        }

        stage('Deploy to EKS') {
            steps {
                script {
                    echo "Updating Kubeconfig for EKS cluster: ${EKS_CLUSTER_NAME}"
                    sh "aws eks update-kubeconfig --name ${EKS_CLUSTER_NAME} --region ${AWS_REGION}"

                    // The rest of your Kubernetes YAMLs and kubectl apply commands remain the same
                    def frontend_deployment_yaml = """
                        apiVersion: apps/v1
                        kind: Deployment
                        metadata:
                          name: py-test-front
                        spec:
                          replicas: 2
                          selector:
                            matchLabels:
                              app: py-test-front
                          template:
                            metadata:
                              labels:
                                app: py-test-front
                            spec:
                              containers:
                              - name: py-test-front
                                image: ${DOCKER_HUB_FRONT_REPO}:${env.BUILD_NUMBER}
                                ports:
                                - containerPort: 80
                    """

                    def frontend_service_yaml = """
                        apiVersion: v1
                        kind: Service
                        metadata:
                          name: py-test-front-service
                        spec:
                          selector:
                            app: py-test-front
                          ports:
                            - protocol: TCP
                              port: 80
                              targetPort: 80
                          type: LoadBalancer
                    """

                    def backend_deployment_yaml = """
                        apiVersion: apps/v1
                        kind: Deployment
                        metadata:
                          name: py-test-back
                        spec:
                          replicas: 2
                          selector:
                            matchLabels:
                              app: py-test-back
                          template:
                            metadata:
                              labels:
                                app: py-test-back
                            spec:
                              containers:
                              - name: py-test-back
                                image: ${DOCKER_HUB_BACK_REPO}:${env.BUILD_NUMBER}
                                ports:
                                - containerPort: 5000
                    """

                    def backend_service_yaml = """
                        apiVersion: v1
                        kind: Service
                        metadata:
                          name: py-test-back-service
                        spec:
                          selector:
                            app: py-test-back
                          ports:
                            - protocol: TCP
                              port: 5000
                              targetPort: 5000
                          type: ClusterIP
                    """

                    // Apply Kubernetes configurations using heredoc for reliable multi-line string passing
                    echo "Applying frontend deployment and service..."
                    sh """cat <<EOF | kubectl apply -f -
${frontend_deployment_yaml}
EOF
"""
                    sh """cat <<EOF | kubectl apply -f -
${frontend_service_yaml}
EOF
"""

                    echo "Applying backend deployment and service..."
                    sh """cat <<EOF | kubectl apply -f -
${backend_deployment_yaml}
EOF
"""
                    sh """cat <<EOF | kubectl apply -f -
${backend_service_yaml}
EOF
"""

                    echo "Deployment to EKS cluster complete!"
                }
            }
        }
    }

    // Post-build actions
    post {
        always {
            cleanWs()
            echo 'Pipeline finished.'
        }
        success {
            echo "Deployment successful! Access frontend at: http://<YOUR_EC2_PUBLIC_IP>:${FLASK_PORT}/frontend/index.html"
        }
        failure {
            echo 'Pipeline failed. Check logs for details.'
        }
    }
}
