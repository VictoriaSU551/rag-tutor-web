import paramiko
import socket

host = '8.153.94.220'
password = 'Zdy666888@'
users = ['ubuntu', 'root', 'admin', 'ec2-user', 'centos']

for user in users:
    print('trying', user)
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(host, username=user, password=password, look_for_keys=False, allow_agent=False, timeout=15, banner_timeout=20, auth_timeout=20)
        stdin, stdout, stderr = ssh.exec_command('whoami && pwd && ls -la')
        print('SUCCESS', user)
        print(stdout.read().decode(errors='ignore'))
        print(stderr.read().decode(errors='ignore'))
        ssh.close()
        break
    except Exception as e:
        print('FAIL', user, type(e).__name__, e)
