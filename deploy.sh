#!/bin/bash

# Exit on any error
set -e

# Variables
DOMAIN="number.news"
APP_PATH="/home/number.news"
VENV_PATH="$APP_PATH/.venv_nn"
PYTHON_VERSION="3.10"
UVICORN_PORT=8002
APACHE_CONF="/etc/apache2/sites-available/$DOMAIN.conf"

# Function to check if command executed successfully
check_command() {
    if [ $? -ne 0 ]; then
        echo "Error: $1"
        exit 1
    fi
}

# Check if Python 3.10 is installed
if ! command -v python3.10 &> /dev/null; then
    echo "Python 3.10 is not installed. Please install it and run this script again."
    exit 1
fi

# Update and install dependencies
echo "Updating system and installing dependencies..."
sudo apt update
sudo apt install -y apache2 libapache2-mod-wsgi-py3
check_command "Failed to install dependencies"

# Create and activate virtual environment
echo "Setting up Python virtual environment..."
python3.10 -m venv $VENV_PATH

# Install Python dependencies from requirements.txt
echo "Installing Python dependencies..."
$VENV_PATH/bin/pip install -r $APP_PATH/requirements.txt
check_command "Failed to install Python dependencies"

# Create a systemd service file for Uvicorn
echo "Creating Uvicorn service..."
sudo tee /etc/systemd/system/numbernews.service > /dev/null << EOL
[Unit]
Description=Uvicorn instance to serve number.news
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=$APP_PATH
Environment="PATH=$VENV_PATH/bin"
ExecStart=$VENV_PATH/bin/uvicorn main:app --host 127.0.0.1 --port $UVICORN_PORT

[Install]
WantedBy=multi-user.target
EOL
check_command "Failed to create Uvicorn service file"

# Start and enable the Uvicorn service
echo "Starting Uvicorn service..."
sudo systemctl start numbernews
sudo systemctl enable numbernews
check_command "Failed to start Uvicorn service"

# Create Apache configuration
echo "Configuring Apache..."
sudo tee $APACHE_CONF > /dev/null << EOL
<VirtualHost *:80>
    ServerName $DOMAIN
    ServerAlias www.$DOMAIN
    
    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:$UVICORN_PORT/
    ProxyPassReverse / http://127.0.0.1:$UVICORN_PORT/

    ErrorLog \${APACHE_LOG_DIR}/$DOMAIN-error.log
    CustomLog \${APACHE_LOG_DIR}/$DOMAIN-access.log combined
</VirtualHost>

<VirtualHost *:443>
    ServerName $DOMAIN
    ServerAlias www.$DOMAIN
    
    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:$UVICORN_PORT/
    ProxyPassReverse / http://127.0.0.1:$UVICORN_PORT/

    ErrorLog \${APACHE_LOG_DIR}/$DOMAIN-error.log
    CustomLog \${APACHE_LOG_DIR}/$DOMAIN-access.log combined

    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/$DOMAIN.pem
    SSLCertificateKeyFile /etc/ssl/private/$DOMAIN.key
</VirtualHost>
EOL
check_command "Failed to create Apache configuration"

# Enable the site and necessary Apache modules
echo "Enabling Apache configuration..."
sudo a2ensite $DOMAIN
sudo a2enmod proxy proxy_http ssl
check_command "Failed to enable Apache configuration"

# Restart Apache
echo "Restarting Apache..."
sudo systemctl restart apache2
check_command "Failed to restart Apache"

echo "Setup complete! Your site should now be accessible at https://$DOMAIN"
echo "Note: Make sure to update the SSL certificate paths in the Apache configuration if they differ."
echo "You may need to configure Cloudflare to use Full (strict) SSL/TLS encryption mode."
echo "Remember to review your Apache configuration to ensure it doesn't conflict with your other websites."