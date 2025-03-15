FROM --platform=linux/amd64 container-registry.oracle.com/database/free:latest

USER root

# Environment variables - these rarely change, good for caching
ENV ORACLE_BASE=/opt/oracle \
    ORACLE_HOME=/opt/oracle/product/23ai/dbhomeFree \
    PATH=/opt/oracle/product/23ai/dbhomeFree/bin:$PATH \
    ORACLE_SID=FREE \
    ORACLE_PDB=FREEPDB1 \
    NLS_LANG=.AL32UTF8

# Create base directories first - good for caching
RUN mkdir -p \
    /opt/oracle/oradata \
    /opt/oracle/product/23ai/dbhomeFree/network/admin \
    /opt/oracle/scripts/setup \
    /opt/oracle/scripts/startup \
    /opt/oracle/diag \
    /opt/oracle/admin \
    /opt/oracle/cfgtoollogs \
    /opt/oracle/audit \
    /opt/oracle/backup \
    /var/tmp/oracle \
    /tmp/oracle

# Setup oratab separately - changes less frequently
RUN touch /etc/oratab && \
    echo "$ORACLE_SID:$ORACLE_HOME:Y" > /etc/oratab && \
    cp /etc/oratab /etc/oratab.bkp && \
    chown 1002850000:0 /etc/oratab /etc/oratab.bkp && \
    chmod 664 /etc/oratab /etc/oratab.bkp

# Set base permissions - separate layer for better caching
RUN chown -R 1002850000:0 \
    /opt/oracle \
    /var/tmp/oracle \
    /tmp/oracle && \
    chmod -R g+rwx \
    /opt/oracle \
    /var/tmp/oracle \
    /tmp/oracle && \
    chmod g+w /etc/passwd && \
    chgrp -R 0 /opt/oracle && \
    chmod -R g=u /opt/oracle

# Copy scripts - keep this late in the build as it changes frequently
COPY scripts/ /opt/oracle/scripts/setup/

# Set script permissions - final layer
RUN chown -R 1002850000:0 \
    /opt/oracle/scripts/setup && \
    chmod -R 755 /opt/oracle/scripts/setup/* && \
    chgrp -R 0 \
    /opt/oracle/scripts/setup && \
    chmod -R g=u \
    /opt/oracle/scripts/setup

# Switch to non-root user
USER 1002850000

VOLUME ["/opt/oracle/oradata"]
EXPOSE 1521

CMD ["/opt/oracle/scripts/setup/start.sh"] 